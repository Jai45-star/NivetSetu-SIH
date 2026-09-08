import { Link } from 'react-router-dom';
import { Building2, Landmark, ArrowRight, ShieldCheck, CircleCheck, FileCheck2, Network, ChartNoAxesCombined } from 'lucide-react';
import { NiveshSetuLogo } from '../../components/brand/NiveshSetuLogo';
import { IndustrialLandscape } from '../../assets/IndustrialLandscape';
import { Button } from '../../components/ui/button';
import { RoleCard } from '../../components/shared/RoleCard';
const snapshot = [{ value: '128+', label: 'Services Integrated', icon: FileCheck2 }, { value: '14', label: 'Departments', icon: Landmark }, { value: '3.6L+', label: 'Applications', icon: Network }, { value: '95.68%', label: 'Disposal Rate', icon: ChartNoAxesCombined }];
export function Landing() {
 return <div className="landing"><a className="skip-link" href="#main">Skip to content</a>
  <header className="landing-header"><Link to="/" aria-label="NiveshSetu home"><NiveshSetuLogo/></Link><nav aria-label="Main navigation"><a href="#about">About NiveshSetu</a><a href="#how-it-works">Our approach</a><Button asChild variant="outline"><a href="#role-login">Explore the demo <ArrowRight/></a></Button></nav></header>
  <main id="main">
   <section className="landing-hero">
    <div className="hero-copy"><span className="hero-badge">For a Smarter, Faster Maharashtra</span><h1>Simpler Approvals.<br/>Stronger Businesses.<br/><span>A Developed<br className="hero-break"/> Maharashtra.</span></h1><p className="hero-description">An intelligent layer for industrial approvals built to reduce errors, save time and support business growth.</p>
     <div className="hero-actions"><Button asChild><Link to="/entrepreneur">Login as Entrepreneur <ArrowRight/></Link></Button><Button asChild variant="outline"><Link to="/officer">Login as Government Officer</Link></Button></div>
     <p className="trust-note"><ShieldCheck size={18}/><span>Designed to work with the existing MAITRI ecosystem — not replace it.</span></p>
     <IndustrialLandscape/>
    </div>
    <aside className="login-panel" id="role-login"><span className="demo-label">SIH 2026 · PROTOTYPE</span><h2>Your next step <br/>starts here.</h2><p>Choose your role to explore NiveshSetu.</p><div className="role-list"><RoleCard role="Entrepreneur" description="Start and manage industrial applications" icon={Building2} to="/entrepreneur"/><RoleCard role="Government Officer" description="Review and process applications" icon={Landmark} to="/officer"/></div><div className="demo-note"><ShieldCheck size={18}/><p><strong>A preview, with no sign-up.</strong><br/>Demo access only. No password or personal information required.</p></div><div className="panel-footer"><CircleCheck size={15}/> Fewer errors. Faster approvals. Better visibility.</div></aside>
   </section>
   <section className="ecosystem" aria-label="MAITRI ecosystem snapshot"><div className="snapshot-heading"><span>MAITRI ecosystem snapshot</span><small>Context for the ecosystem we aim to support</small></div><div className="snapshot-grid">{snapshot.map(({ value, label, icon: Icon }) => <div key={label}><Icon size={23}/><span><strong>{value}</strong><small>{label}</small></span></div>)}</div><p className="snapshot-note">Figures supplied for this prototype; not NiveshSetu achievements or live data.</p></section>
   <section className="approach" id="about"><div><span className="eyebrow">BUILT AROUND GETTING IT RIGHT</span><h2>A clearer path from<br/>intent to industry.</h2><p>An intelligence layer for the industrial approval ecosystem. Supporting entrepreneurs and officers at every step.</p></div><div className="approach-steps" id="how-it-works"><div><span>01</span><section><h3>Prepare with confidence</h3><p>First-Time-Right applications begin with clearer requirements.</p></section></div><div><span>02</span><section><h3>Reduce the back and forth</h3><p>Better preparation can reduce incomplete applications and repeated scrutiny.</p></section></div><div><span>03</span><section><h3>See the way forward</h3><p>A foundation for regulatory assistance and bottleneck visibility in future phases.</p></section></div></div></section>
  </main><footer className="landing-footer"><span>NiveshSetu <span className="footer-separator">/</span> First-Time-Right Industrial Approvals</span><span>SIH 2026 · SIH26130 · Phase 1 demo</span></footer>
 </div>;
}

