from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Internship, User
from schemas import InternshipCreate, InternshipResponse
from fastapi import APIRouter, Depends, HTTPException
from schemas import (
    InternshipCreate,
    InternshipResponse,
    InternshipStatusUpdate
)


router = APIRouter(
    prefix="/api/internships",
    tags=["Internships"]
)


@router.post(
    "/",
    response_model=InternshipResponse
)
def create_internship(
    internship_data: InternshipCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    internship = Internship(
        user_id=current_user.id,
        company=internship_data.company,
        role=internship_data.role,
        location=internship_data.location,
        application_date=internship_data.application_date,
        deadline=internship_data.deadline,
        status=internship_data.status,
        job_url=internship_data.job_url,
        notes=internship_data.notes
    )

    db.add(internship)
    db.commit()
    db.refresh(internship)

    return internship

@router.get("/", response_model=list[InternshipResponse])
def get_internships(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    internships = (
        db.query(Internship)
        .filter(Internship.user_id == current_user.id)
        .order_by(Internship.created_at.desc())
        .all()
    )

    return internships


@router.patch("/{internship_id}/status")
def update_internship_status(
    internship_id: int,
    status_data: InternshipStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    internship = (
        db.query(Internship)
        .filter(
            Internship.id == internship_id,
            Internship.user_id == current_user.id
        )
        .first()
    )

    if not internship:
        raise HTTPException(
            status_code=404,
            detail="Internship not found"
        )

    internship.status = status_data.status

    db.commit()
    db.refresh(internship)

    return {
        "message": "Internship status updated successfully",
        "internship_id": internship.id,
        "status": internship.status
    }

@router.delete("/{internship_id}")
def delete_internship(
    internship_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    internship = (
        db.query(Internship)
        .filter(
            Internship.id == internship_id,
            Internship.user_id == current_user.id
        )
        .first()
    )

    if not internship:
        raise HTTPException(
            status_code=404,
            detail="Internship not found"
        )

    db.delete(internship)
    db.commit()

    return {
        "message": "Internship deleted successfully",
        "internship_id": internship_id
    }

@router.get("/stats")
def get_internship_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    internships = (
        db.query(Internship)
        .filter(Internship.user_id == current_user.id)
        .all()
    )

    stats = {
        "total": len(internships),
        "Saved": 0,
        "Applied": 0,
        "Assessment": 0,
        "Interview": 0,
        "Rejected": 0,
        "Selected": 0
    }

    for internship in internships:
        if internship.status in stats and internship.status != "total":
            stats[internship.status] += 1

    return stats
