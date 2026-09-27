from pydantic import BaseModel, Field, field_validator


class TrustedContactSchema(BaseModel):
    name: str = Field(..., min_length=1)
    phone: str = Field(..., min_length=1)
    relationship: str
    autoSms: bool = True
    pushNotification: bool = True

    @field_validator("name", "phone")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be empty")
        return v.strip()


class CodewordsSchema(BaseModel):
    distressCodeword: str = Field(..., min_length=1)
    cancellationPhrase: str = Field(..., min_length=1)
    allowCancellation: bool = True

    @field_validator("distressCodeword", "cancellationPhrase")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Phrase cannot be empty")
        return v.strip()


class SettingsResponse(BaseModel):
    trustedContact: TrustedContactSchema
    codewords: CodewordsSchema


class SaveTrustedContactResponse(BaseModel):
    success: bool = True
    trustedContact: TrustedContactSchema


class SaveCodewordsResponse(BaseModel):
    success: bool = True
    codewords: CodewordsSchema
