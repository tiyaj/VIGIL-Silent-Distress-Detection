from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.trusted_contact import TrustedContact
from app.models.codeword import Codeword
from app.schemas.settings import (
    TrustedContactSchema,
    CodewordsSchema,
    SettingsResponse,
    SaveTrustedContactResponse,
    SaveCodewordsResponse,
)

router = APIRouter(prefix="/settings", tags=["settings"])

DEFAULT_CONTACT = {
    "name": "Sarah Connor",
    "phone": "+1 (555) 382-9011",
    "relationship": "Family Member",
    "autoSms": True,
    "pushNotification": True,
}

DEFAULT_CODEWORDS = {
    "distressCodeword": "Silver Willow",
    "cancellationPhrase": "Status Clear Blue",
    "allowCancellation": True,
}


@router.get("", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    contact = db.query(TrustedContact).order_by(TrustedContact.id.desc()).first()
    if not contact:
        contact = TrustedContact(
            name=DEFAULT_CONTACT["name"],
            phone=DEFAULT_CONTACT["phone"],
            relationship=DEFAULT_CONTACT["relationship"],
            auto_sms=DEFAULT_CONTACT["autoSms"],
            push_notification=DEFAULT_CONTACT["pushNotification"],
        )
        db.add(contact)
        db.commit()
        db.refresh(contact)

    codewords = db.query(Codeword).order_by(Codeword.id.desc()).first()
    if not codewords:
        codewords = Codeword(
            distress_codeword=DEFAULT_CODEWORDS["distressCodeword"],
            cancellation_phrase=DEFAULT_CODEWORDS["cancellationPhrase"],
            allow_cancellation=DEFAULT_CODEWORDS["allowCancellation"],
        )
        db.add(codewords)
        db.commit()
        db.refresh(codewords)

    return SettingsResponse(
        trustedContact=TrustedContactSchema(
            name=contact.name,
            phone=contact.phone,
            relationship=contact.relationship,
            autoSms=contact.auto_sms,
            pushNotification=contact.push_notification,
        ),
        codewords=CodewordsSchema(
            distressCodeword=codewords.distress_codeword,
            cancellationPhrase=codewords.cancellation_phrase,
            allowCancellation=codewords.allow_cancellation,
        ),
    )


@router.post("/trusted-contact", response_model=SaveTrustedContactResponse)
def save_trusted_contact(data: TrustedContactSchema, db: Session = Depends(get_db)):
    contact = db.query(TrustedContact).order_by(TrustedContact.id.desc()).first()
    if contact:
        contact.name = data.name
        contact.phone = data.phone
        contact.relationship = data.relationship
        contact.auto_sms = data.autoSms
        contact.push_notification = data.pushNotification
    else:
        contact = TrustedContact(
            name=data.name,
            phone=data.phone,
            relationship=data.relationship,
            auto_sms=data.autoSms,
            push_notification=data.pushNotification,
        )
        db.add(contact)

    db.commit()
    db.refresh(contact)

    return SaveTrustedContactResponse(
        success=True,
        trustedContact=TrustedContactSchema(
            name=contact.name,
            phone=contact.phone,
            relationship=contact.relationship,
            autoSms=contact.auto_sms,
            pushNotification=contact.push_notification,
        ),
    )


@router.post("/codewords", response_model=SaveCodewordsResponse)
def save_codewords(data: CodewordsSchema, db: Session = Depends(get_db)):
    cw = db.query(Codeword).order_by(Codeword.id.desc()).first()
    if cw:
        cw.distress_codeword = data.distressCodeword
        cw.cancellation_phrase = data.cancellationPhrase
        cw.allow_cancellation = data.allowCancellation
    else:
        cw = Codeword(
            distress_codeword=data.distressCodeword,
            cancellation_phrase=data.cancellationPhrase,
            allow_cancellation=data.allowCancellation,
        )
        db.add(cw)

    db.commit()
    db.refresh(cw)

    return SaveCodewordsResponse(
        success=True,
        codewords=CodewordsSchema(
            distressCodeword=cw.distress_codeword,
            cancellationPhrase=cw.cancellation_phrase,
            allowCancellation=cw.allow_cancellation,
        ),
    )
