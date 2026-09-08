import { PageHeader } from '../components/layout/PageHeader';
import { EmptyState } from '../components/shared/EmptyState';
export function Placeholder({ title, role }) { return <><PageHeader title={title} description="Your workspace is ready for the next phase."/><EmptyState title={`${title}, coming in a later phase`} description="This route establishes the application structure. The workflow is not enabled in the Phase 1 demo." to={`/${role}`}/></>; }
