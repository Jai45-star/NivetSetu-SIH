import { Construction, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
export function EmptyState({ title, description, to, action = 'Back to dashboard' }) { return <Card className="empty-state"><span className="empty-icon"><Construction size={30}/></span><span className="eyebrow">PHASE 1 PREVIEW</span><h2>{title}</h2><p>{description}</p><Button asChild variant="outline"><Link to={to}><ArrowLeft/>{action}</Link></Button></Card>; }
