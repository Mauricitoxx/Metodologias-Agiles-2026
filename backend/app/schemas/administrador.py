from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, field_validator

# Emojis que se pueden elegir como avatar del staff (el panel muestra la misma lista)
AVATARES = ("🛡️", "🤖", "🎮", "👾", "🎲", "⚡")
AVATAR_POR_DEFECTO = "🛡️"


def validar_avatar(value: str) -> str:
    if value not in AVATARES:
        raise ValueError("Elegí uno de los avatares disponibles.")
    return value


Avatar = Annotated[str, AfterValidator(validar_avatar)]


class AdministradorBase(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=254)

    @field_validator("email")
    @classmethod
    def normalizar_email(cls, value: str) -> str:
        value = value.strip().lower()
        if "@" not in value or any(char.isspace() for char in value):
            raise ValueError("Ingresá un correo electrónico válido.")
        return value

    @field_validator("nombre")
    @classmethod
    def normalizar_nombre(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("El nombre no puede estar vacío.")
        return value


class AdministradorCreate(AdministradorBase):
    password: str = Field(min_length=6, max_length=256)
    avatar: Avatar = AVATAR_POR_DEFECTO


class AdministradorUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=100)
    email: str | None = Field(default=None, min_length=3, max_length=254)
    password: str | None = Field(default=None, min_length=6, max_length=256)
    avatar: Avatar | None = None

    @field_validator("email")
    @classmethod
    def normalizar_email(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip().lower()
        if "@" not in value or any(char.isspace() for char in value):
            raise ValueError("Ingresá un correo electrónico válido.")
        return value

    @field_validator("nombre")
    @classmethod
    def normalizar_nombre(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("El nombre no puede estar vacío.")
        return value


class AdministradorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    email: str
    activo: bool = True
    avatar: str = AVATAR_POR_DEFECTO
