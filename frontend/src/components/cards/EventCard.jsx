import { Eye, Edit3, Trash2, RotateCcw, Calendar, Clock, Users, Trophy } from 'lucide-react';
import { StatusBadge } from '../common/Badge';

export const EventCard = ({ item, onOpenDetail, onOpenEdit, onOpenConfirmBaja }) => {
  const isBaja = item.status === 'baja' || item.status === 'cancelado';

  return (
    <div className={`catalog-item-card ${isBaja ? 'is-baja-state' : ''}`}>
      <div className="card-main-content">
        <div className="card-thumb-container card-thumb-event">
          <div className="event-calendar-badge">
            <Trophy size={28} className="event-trophy-icon" />
            <span className="event-date-short">{item.date?.split('-').slice(1).join('/')}</span>
          </div>
          <span className="shelf-badge">{item.category}</span>
        </div>

        <div className="card-info-container">
          <div className="card-header-row">
            <span className="item-code-chip">{item.code}</span>
            <StatusBadge status={item.status} />
          </div>

          <h3 className="card-item-title">{item.title}</h3>

          <div className="card-meta-row">
            <span className="meta-spec">
              <Calendar size={13} className="meta-icon" /> {item.date}
            </span>
            <span className="meta-spec">
              • <Clock size={13} className="meta-icon" /> {item.time}
            </span>
          </div>

          <div className="card-footer-chips">
            <span className="slots-badge">
              <Users size={12} /> {item.bookedSlots}/{item.maxSlots} cupos
            </span>
            <span className="fee-badge">Inscripción: {item.fee}</span>
          </div>
        </div>
      </div>

      <div className="card-actions-bar">
        <button
          className="btn-card-action btn-ficha"
          onClick={() => onOpenDetail('events', item)}
          title="Ver Ficha del Evento"
        >
          <Eye size={15} /> FICHA
        </button>

        <button
          className="btn-card-action btn-edit"
          onClick={() => onOpenEdit('events', item)}
          title="Editar Evento"
        >
          <Edit3 size={15} /> EDITAR
        </button>

        <button
          className={`btn-card-action btn-icon-baja ${isBaja ? 'btn-icon-restore' : ''}`}
          onClick={() => onOpenConfirmBaja('events', item)}
          title={isBaja ? 'Reactivar Evento' : 'Cancelar / Dar de Baja'}
        >
          {isBaja ? <RotateCcw size={15} /> : <Trash2 size={15} />}
        </button>
      </div>
    </div>
  );
};
