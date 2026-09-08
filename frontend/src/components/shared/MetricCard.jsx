import { Files, FilePenLine, Clock3, TriangleAlert } from 'lucide-react';
import { Card } from '../ui/card';
const icons = { files: Files, draft: FilePenLine, clock: Clock3, alert: TriangleAlert };
export function MetricCard({ value, label, tone, icon }) { const Icon = icons[icon]; return <Card className={`metric-card tone-${tone}`}><span className="metric-icon"><Icon size={21}/></span><div><strong>{value}</strong><p>{label}</p></div></Card>; }
