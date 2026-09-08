import { useState } from 'react';
import { ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import {
  INDUSTRY_OPTIONS,
  LOCATION_OPTIONS,
  INVESTMENT_OPTIONS,
  EMPLOYEE_OPTIONS,
  STAGE_OPTIONS,
} from '../../data/formOptions';

export function BusinessProfileForm({
  initialData = {},
  onSubmit,
  onBack,
  isSubmitting = false,
  showBack = true,
}) {
  const [formData, setFormData] = useState({
    industryType: initialData.industryType || '',
    location: initialData.location || '',
    investmentRange: initialData.investmentRange || '',
    employeeRange: initialData.employeeRange || '',
    businessStage: initialData.businessStage || '',
    description: initialData.description || '',
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.industryType) errs.industryType = 'Please select an Industry Type';
    if (!formData.location) errs.location = 'Please select an industrial Location';
    if (!formData.investmentRange) errs.investmentRange = 'Please select an Investment Range';
    if (!formData.employeeRange) errs.employeeRange = 'Please select Workforce/Employee Range';
    if (!formData.businessStage) errs.businessStage = 'Please select Business Stage';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form className="business-profile-form" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        {/* Industry Type */}
        <div className={`form-field ${errors.industryType ? 'has-error' : ''}`}>
          <label htmlFor="field-industry">
            Industry Type <span className="req-star">*</span>
          </label>
          <select
            id="field-industry"
            value={formData.industryType}
            onChange={(e) => handleChange('industryType', e.target.value)}
            className="form-select"
          >
            <option value="">Select Industry Type</option>
            {INDUSTRY_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {errors.industryType && (
            <p className="field-error-msg"><AlertCircle size={12} /> {errors.industryType}</p>
          )}
        </div>

        {/* Location */}
        <div className={`form-field ${errors.location ? 'has-error' : ''}`}>
          <label htmlFor="field-location">
            Location <span className="req-star">*</span>
          </label>
          <select
            id="field-location"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            className="form-select"
          >
            <option value="">Select District / Region</option>
            {LOCATION_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {errors.location && (
            <p className="field-error-msg"><AlertCircle size={12} /> {errors.location}</p>
          )}
        </div>

        {/* Investment Range */}
        <div className={`form-field ${errors.investmentRange ? 'has-error' : ''}`}>
          <label htmlFor="field-investment">
            Investment (INR) <span className="req-star">*</span>
          </label>
          <select
            id="field-investment"
            value={formData.investmentRange}
            onChange={(e) => handleChange('investmentRange', e.target.value)}
            className="form-select"
          >
            <option value="">Select Investment Range</option>
            {INVESTMENT_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {errors.investmentRange && (
            <p className="field-error-msg"><AlertCircle size={12} /> {errors.investmentRange}</p>
          )}
        </div>

        {/* Number of Employees */}
        <div className={`form-field ${errors.employeeRange ? 'has-error' : ''}`}>
          <label htmlFor="field-employees">
            Number of Employees <span className="req-star">*</span>
          </label>
          <select
            id="field-employees"
            value={formData.employeeRange}
            onChange={(e) => handleChange('employeeRange', e.target.value)}
            className="form-select"
          >
            <option value="">Select Employee Range</option>
            {EMPLOYEE_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {errors.employeeRange && (
            <p className="field-error-msg"><AlertCircle size={12} /> {errors.employeeRange}</p>
          )}
        </div>

        {/* Business Stage */}
        <div className={`form-field full-width ${errors.businessStage ? 'has-error' : ''}`}>
          <label htmlFor="field-stage">
            Business Stage <span className="req-star">*</span>
          </label>
          <select
            id="field-stage"
            value={formData.businessStage}
            onChange={(e) => handleChange('businessStage', e.target.value)}
            className="form-select"
          >
            <option value="">Select Project Stage</option>
            {STAGE_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {errors.businessStage && (
            <p className="field-error-msg"><AlertCircle size={12} /> {errors.businessStage}</p>
          )}
        </div>

        {/* Brief Description */}
        <div className="form-field full-width">
          <label htmlFor="field-description">
            Brief Description <span className="optional-tag">(Optional)</span>
          </label>
          <textarea
            id="field-description"
            rows={3}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Manufacturing of packaged food products, processing details, equipment, etc."
            className="form-textarea"
          />
        </div>
      </div>

      <div className="form-action-bar">
        {showBack && onBack ? (
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </Button>
        ) : <div />}

        <div className="action-bar-right">
          <Button type="submit" variant="default" disabled={isSubmitting}>
            {isSubmitting ? (
              'Saving...'
            ) : (
              <>Save & Continue <ArrowRight size={16} /></>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
