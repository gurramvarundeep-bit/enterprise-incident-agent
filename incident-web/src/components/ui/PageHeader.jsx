export default function PageHeader({ title, description, actions, meta }) {
  return (
    <div className="page-header">
      <div className="page-header__text">
        <div className="page-header__title-row">
          <h2>{title}</h2>
          {meta}
        </div>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  );
}
