import enum
from decimal import Decimal

from sqlalchemy import CheckConstraint, Enum, Numeric, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class TipoProducto(str, enum.Enum):
    comida = "comida"
    bebida = "bebida"
    snack = "snack"
    postre = "postre"
    combo = "combo"


class Producto(Base):
    __tablename__ = "productos"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(150))
    descripcion: Mapped[str] = mapped_column(Text)
    tipo: Mapped[TipoProducto] = mapped_column(
        Enum(TipoProducto, native_enum=False, length=20),
        index=True,
    )
    # Numeric para no perder centavos al guardar precios decimales
    precio: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    # Baja lógica: los inactivos no se muestran en la carta
    activo: Mapped[bool] = mapped_column(default=True, server_default=text("true"))

    __table_args__ = (
        # La base también rechaza precios menores o iguales a cero
        CheckConstraint("precio > 0", name="ck_productos_precio_positivo"),
    )
