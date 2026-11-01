
from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
)

try:
    with engine.begin() as conn:
        # 1. Crear la tabla de categorías.
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS categorias_manga_comic (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL UNIQUE,
                descripcion TEXT NOT NULL
            );
        """))

        # 2. Agregar la FK, inicialmente nullable.
        conn.execute(text("""
            ALTER TABLE manga_comics
            ADD COLUMN IF NOT EXISTS categoria_manga_comic_id INTEGER;
        """))

        # 3. Crear categorías a partir de los valores existentes.
        conn.execute(text("""
            INSERT INTO categorias_manga_comic (nombre, descripcion)
            SELECT DISTINCT
                COALESCE(NULLIF(BTRIM(category), ''), 'Sin categoría'),
                'Categoría migrada automáticamente desde los registros existentes.'
            FROM manga_comics
            ON CONFLICT (nombre) DO NOTHING;
        """))

        # 4. Asociar cada manga/cómic con su categoría.
        conn.execute(text("""
            UPDATE manga_comics AS mc
            SET categoria_manga_comic_id = cat.id
            FROM categorias_manga_comic AS cat
            WHERE cat.nombre =
                COALESCE(NULLIF(BTRIM(mc.category), ''), 'Sin categoría')
              AND mc.categoria_manga_comic_id IS NULL;
        """))

        # 5. Comprobar que todos tengan categoría.
        pendientes = conn.execute(text("""
            SELECT COUNT(*)
            FROM manga_comics
            WHERE categoria_manga_comic_id IS NULL;
        """)).scalar_one()

        if pendientes > 0:
            raise Exception(
                f"Hay {pendientes} registros sin categoría. "
                "Se cancela la operación."
            )

        # 6. Establecer la FK como obligatoria.
        conn.execute(text("""
            ALTER TABLE manga_comics
            ALTER COLUMN categoria_manga_comic_id SET NOT NULL;
        """))

        # 7. Crear la restricción FK si todavía no existe.
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'fk_manga_comics_categoria'
                ) THEN
                    ALTER TABLE manga_comics
                    ADD CONSTRAINT fk_manga_comics_categoria
                    FOREIGN KEY (categoria_manga_comic_id)
                    REFERENCES categorias_manga_comic(id);
                END IF;
            END $$;
        """))

    print("Migración de categorías completada correctamente.")

except Exception as error:
    print("Error durante la migración. Se revirtieron los cambios.")
    print(error)

finally:
    engine.dispose()
