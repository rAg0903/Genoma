import { Navigate, useParams, useSearchParams } from 'react-router';
import { withRecordQuery } from '../../lib/record-tabs';

/** Redireciona `/processos/:id/editar` para edição inline na vista do processo. */
export function ProcessFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  if (!id) return <Navigate to="/processos" replace />;
  return <Navigate to={withRecordQuery(`/processos/${id}`, { tab, edit: true })} replace />;
}
