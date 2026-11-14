
from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
)

try:
    with engine.begin() as conn:

        # 1. Crear la tabla intermedia.
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS manga_comic_categorias (
                manga_comic_id INTEGER NOT NULL,
                categoria_id INTEGER NOT NULL,

                CONSTRAINT pk_manga_comic_categorias
                    PRIMARY KEY (manga_comic_id, categoria_id),

                CONSTRAINT fk_mcc_manga_comic
                    FOREIGN KEY (manga_comic_id)
                    REFERENCES manga_comics(id)
                    ON DELETE CASCADE,

                CONSTRAINT fk_mcc_categoria
                    FOREIGN KEY (categoria_id)
                    REFERENCES categorias_manga_comic(id)
                    ON DELETE CASCADE
            );
        """))

        # 2. Copiar las asociaciones existentes.
        conn.execute(text("""
            INSERT INTO manga_comic_categorias (
                manga_comic_id,
                categoria_id
            )
            SELECT
                id,
                categoria_manga_comic_id
            FROM manga_comics
            WHERE categoria_manga_comic_id IS NOT NULL
            ON CONFLICT (manga_comic_id, categoria_id) DO NOTHING;
        """))

        # 3. Verificar que todos los registros con categoría
        # tengan su asociación en la tabla intermedia.
        pendientes = conn.execute(text("""
            SELECT COUNT(*)
            FROM manga_comics mc
            WHERE mc.categoria_manga_comic_id IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1
                  FROM manga_comic_categorias mcc
                  WHERE mcc.manga_comic_id = mc.id
                    AND mcc.categoria_id = mc.categoria_manga_comic_id
              );
        """)).scalar_one()

        if pendientes > 0:
            raise Exception(
                f"Hay {pendientes} asociaciones sin migrar. "
                "Se cancela la operación."
            )

        # 4. Verificar que no haya registros sin ninguna categoría.
        sin_categoria = conn.execute(text("""
            SELECT COUNT(*)
            FROM manga_comics mc
            WHERE NOT EXISTS (
                SELECT 1
                FROM manga_comic_categorias mcc
                WHERE mcc.manga_comic_id = mc.id
            );
        """)).scalar_one()

        if sin_categoria > 0:
            raise Exception(
                f"Hay {sin_categoria} mangas o cómics sin género. "
                "Se cancela la operación."
            )

    print("Tabla intermedia creada y asociaciones migradas correctamente.")

except Exception as error:
    print("Error durante la migración. Se revirtieron los cambios.")
    raise

finally:
    engine.dispose()
