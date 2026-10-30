from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer, field_validator

from app.models.producto import TipoProducto

NonEmptyStr = Annotated[str, Field(min_length=1)]
# Hasta 8 enteros y 2 decimales, igual que la columna Numeric(10, 2).
# En JSON sale como número (Pydantic serializa Decimal como texto).
Precio = Annotated[
    Decimal,
    Field(max_digits=10, decimal_places=2),
    PlainSerializer(float, return_type=float, when_used="json"),
]


class ProductoBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nombre: Annotated[NonEmptyStr, Field(max_length=50)]
    descripcion: Annotated[NonEmptyStr, Field(max_length=500)]
    tipo: TipoProducto
    precio: Precio

    @field_validator("precio")
    @classmethod
    def validate_precio(cls, value: Decimal) -> Decimal:
        if value <= 0:
            raise ValueError("El precio debe ser mayor a cero")
        return value


class ProductoCreate(ProductoBase):
    # El panel puede registrar un producto ya inactivo (fuera de la carta)
    activo: bool = True


class ProductoUpdate(ProductoBase):
    # Si no se envía, el producto conserva su estado
    activo: bool | None = None


class ProductoRead(ProductoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    activo: bool
