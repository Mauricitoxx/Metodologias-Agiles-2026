from decimal import Decimal
from typing import Annotated

from pydantic import (
    AfterValidator,
    BaseModel,
    BeforeValidator,
    ConfigDict,
    Field,
    PlainSerializer,
    ValidationInfo,
    field_validator,
)

from app.models.producto import TipoProducto
from app.schemas.actividad import ensure_web_url

NonEmptyStr = Annotated[str, Field(min_length=1)]
# Hasta 8 enteros y 2 decimales, igual que la columna Numeric(10, 2).
# En JSON sale como número (Pydantic serializa Decimal como texto).
Precio = Annotated[
    Decimal,
    Field(max_digits=10, decimal_places=2),
    PlainSerializer(float, return_type=float, when_used="json"),
]
# URL web de la foto, igual que en actividades. Vacía significa "sin foto"
ImagenUrl = Annotated[str, Field(max_length=500), AfterValidator(ensure_web_url)]
ImagenOpcional = Annotated[
    ImagenUrl | None,
    BeforeValidator(lambda value: (value.strip() or None) if isinstance(value, str) else value),
]


class ProductoBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nombre: Annotated[NonEmptyStr, Field(max_length=50)]
    descripcion: Annotated[NonEmptyStr, Field(max_length=500)]
    tipo: TipoProducto
    precio: Precio
    # HU-13: oferta opcional. Si no se envía o llega vacía, el producto no tiene oferta
    precio_oferta: Precio | None = None
    imagen: ImagenOpcional = None

    @field_validator("precio")
    @classmethod
    def validate_precio(cls, value: Decimal) -> Decimal:
        if value <= 0:
            raise ValueError("El precio debe ser mayor a cero")
        return value

    @field_validator("precio_oferta")
    @classmethod
    def validate_precio_oferta(cls, value: Decimal | None, info: ValidationInfo) -> Decimal | None:
        if value is None:
            return value
        if value <= 0:
            raise ValueError("El precio de oferta debe ser mayor a cero")
        # Si el precio no pasó su propia validación, ese error ya se informa aparte
        precio = info.data.get("precio")
        if precio is not None and value >= precio:
            raise ValueError("El precio de oferta debe ser menor al precio actual")
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
