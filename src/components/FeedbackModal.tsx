import React, { useState, useEffect } from 'react';
import { FeedbackCategory, FeedbackSubmission } from '../types';
import { useToast } from '../hooks/useToast';
import XIcon from './icons/XIcon';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import BugIcon from './icons/BugIcon';
import LightbulbIcon from './icons/LightbulbIcon';
import QuestionMarkCircleIcon from './icons/QuestionMarkCircleIcon';
import PaletteIcon from './icons/PaletteIcon';
import HeartIcon from './icons/HeartIcon';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: FeedbackSubmission) => void;
  userEmail?: string;
}

type Step = 'category' | 'form';

const CATEGORIES = {
  bug: {
    icon: BugIcon,
    title: 'Report a Bug or Issue',
    description: "Something isn't working as expected.",
    header: 'Thanks for helping us improve! Please be as detailed as possible.',
  },
  idea: {
    icon: LightbulbIcon,
    title: 'Suggest an Idea or Feature',
    description: 'I have a new idea for the product.',
    header: 'We love new ideas! Great suggestions help us build a better product.',
  },
  question: {
    icon: QuestionMarkCircleIcon,
    title: 'Ask a Question',
    description: "I'm confused about how to do something.",
    header: "Have a question? We're here to help.",
  },
  design: {
    icon: PaletteIcon,
    title: 'Comment on the Design/Usability',
    description: 'Something is hard to use or could look better.',
    header: 'Your design and usability feedback is invaluable.',
  },
  general: {
    icon: HeartIcon,
    title: 'Share General Feedback or Praise',
    description: 'I want to share my overall experience.',
    header: 'We appreciate you taking the time to share your thoughts!',
  },
};

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmit, userEmail }) => {
  const [step, setStep] = useState<Step>('category');
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [allowContact, setAllowContact] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setStep('category');
      setSelectedCategory(null);
      setFormData({});
      setAllowContact(true);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleCategorySelect = (category: FeedbackCategory) => {
    setSelectedCategory(category);
    setStep('form');
  };
  
  const handleBack = () => {
    setStep('category');
    // Keep formData so user doesn't lose their input if they go back
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }
  
  const handleImportanceChange = (value: string) => {
     setFormData(prev => ({...prev, importance: value}));
  }

  const isFormValid = () => {
    if (!selectedCategory) return false;
    if (selectedCategory === 'bug') {
        return formData.summary && formData.steps;
    }
    if (selectedCategory === 'idea') {
        return formData.idea && formData.problem && formData.importance;
    }
    if (selectedCategory === 'question') {
        return formData.doing && formData.question;
    }
    if (selectedCategory === 'design') {
        return formData.partOfApp && formData.thoughts;
    }
    if (selectedCategory === 'general') {
        return formData.mind;
    }
    return false;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !isFormValid()) return;
    
    const submission: FeedbackSubmission = {
      category: selectedCategory,
      formData,
      allowContact,
      context: {
        userEmail,
        url: window.location.href,
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
      },
    };
    onSubmit(submission);
    showToast('Thank you for your feedback!', { type: 'success' });
  };

  const renderCategorySelector = () => (
    <>
      <div className="flex justify-between items-start">
        <h2 id="feedback-modal-title" className="text-xl font-bold text-gray-900">
          Share Your Feedback
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
          <XIcon className="h-6 w-6" />
        </button>
      </div>
      <p className="mt-2 text-sm text-gray-600">
        What kind of feedback do you have? This helps us route it to the right team.
      </p>
      <div className="mt-6 space-y-3">
        {(Object.keys(CATEGORIES) as FeedbackCategory[]).map(key => {
          const { icon: Icon, title, description } = CATEGORIES[key];
          return (
            <button
              key={key}
              onClick={() => handleCategorySelect(key)}
              className="w-full text-left p-4 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <Icon className="h-8 w-8 text-brand-blue" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{title}</p>
                  <p className="text-sm text-gray-500">{description}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </>
  );

  const renderForm = () => {
    if (!selectedCategory) return null;
    const { header } = CATEGORIES[selectedCategory];

    return (
       <form onSubmit={handleSubmit}>
         <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2">
                <button type="button" onClick={handleBack} className="text-gray-500 hover:text-gray-800 p-1 -ml-1" aria-label="Back to categories">
                    <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <h2 id="feedback-modal-title" className="text-xl font-bold text-gray-900">
                    {CATEGORIES[selectedCategory].title}
                </h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
              <XIcon className="h-6 w-6" />
            </button>
         </div>
         <p className="mt-2 text-sm text-gray-600">{header}</p>
         
         <div className="mt-6 space-y-4">
            {selectedCategory === 'bug' && (
                <>
                    <label className="block text-sm font-medium text-gray-700">Short Summary <span className="text-red-500">*</span></label>
                    <input type="text" name="summary" value={formData.summary || ''} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm text-gray-900" style={{ colorScheme: 'light' }} placeholder="e.g., The 'Download Selected' button is not working." />
                    
                    <label className="block text-sm font-medium text-gray-700">Steps to Reproduce <span className="text-red-500">*</span></label>
                    <textarea name="steps" rows={4} value={formData.steps || ''} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm text-gray-900" style={{ colorScheme: 'light' }} placeholder={"Tell us the exact steps that cause the problem. For example:\n1. I selected three records from the table.\n2. I clicked 'Download Selected'.\n3. Nothing happened."} />

                    <label className="block text-sm font-medium text-gray-700">Expected vs. Actual Behavior</label>
                    <textarea name="behavior" rows={3} value={formData.behavior || ''} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm text-gray-900" style={{ colorScheme: 'light' }} placeholder={"What did you expect to happen? What happened instead?\ne.g., I expected a PDF to download. Instead, the button was disabled for a second and then nothing."} />
                </>
            )}
            {selectedCategory === 'idea' && (
                <>
                    <label className="block text-sm font-medium text-gray-700">What is your idea? <span className="text-red-500">*</span></label>
                    <input type="text" name="idea" value={formData.idea || ''} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm text-gray-900" style={{ colorScheme: 'light' }} placeholder="e.g., Ability to email reports directly from the dashboard." />
                    
                    <label className="block text-sm font-medium text-gray-700">What problem would this solve for you? <span className="text-red-500">*</span></label>
                    <textarea name="problem" rows={4} value={formData.problem || ''} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm text-gray-900" style={{ colorScheme: 'light' }} placeholder="e.g., Currently I have to download the PDF, open my email client, attach it, and send it. This takes multiple steps and is repetitive." />

                    <label className="block text-sm font-medium text-gray-700">How important is this for you? <span className="text-red-500">*</span></label>
                    <div className="flex space-x-2 mt-1">
                       {['Nice to Have', 'Important', 'Critical'].map(level => (
                           <button type="button" key={level} onClick={() => handleImportanceChange(level)} className={`px-4 py-2 text-sm rounded-md border ${formData.importance === level ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                             {level}
                           </button>
                       ))}
                    </div>
                </>
            )}
            {selectedCategory === 'question' && (
                 <>
                    <label className="block text-sm font-medium text-gray-700">What are you trying to do? <span className="text-red-500">*</span></label>
                    <input type="text" name="doing" value={formData.doing || ''} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm text-gray-900" style={{ colorScheme: 'light' }} placeholder="e.g., I'm trying to filter records by a specific date range." />
                    
                    <label className="block text-sm font-medium text-gray-700">What is your question? <span className="text-red-500">*</span></label>
                    <textarea name="question" rows={4} value={formData.question || ''} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm text-gray-900" style={{ colorScheme: 'light' }} placeholder="e.g., When I select a start and end date, the table doesn't update. Am I missing a step?" />
                 </>
            )}
             {selectedCategory === 'design' && (
                 <>
                    <label className="block text-sm font-medium text-gray-700">What part of the app are you commenting on? <span className="text-red-500">*</span></label>
                    <input type="text" name="partOfApp" value={formData.partOfApp || ''} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm text-gray-900" style={{ colorScheme: 'light' }} placeholder="e.g., The filter controls at the top of the page." />
                    
                    <label className="block text-sm font-medium text-gray-700">What are your thoughts? <span className="text-red-500">*</span></label>
                    <textarea name="thoughts" rows={4} value={formData.thoughts || ''} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm text-gray-900" style={{ colorScheme: 'light' }} placeholder="e.g., The multi-select dropdowns are great, but it's hard to tell how many items are selected without opening them." />
                 </>
            )}
            {selectedCategory === 'general' && (
                <>
                    <label className="block text-sm font-medium text-gray-700">What's on your mind? <span className="text-red-500">*</span></label>
                    <textarea name="mind" rows={5} value={formData.mind || ''} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm text-gray-900" style={{ colorScheme: 'light' }} placeholder="Whether it's praise, a concern, or a general comment about your experience, we're listening." />
                </>
            )}
         </div>

        <div className="mt-6">
            <label className="flex items-center">
                <input type="checkbox" checked={allowContact} onChange={(e) => setAllowContact(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue" style={{ colorScheme: 'light' }}/>
                <span className="ml-2 text-sm text-gray-600">It's okay to contact me if you have more questions about this feedback.</span>
            </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-gray-200">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue">
            Cancel
          </button>
          <button type="submit" disabled={!isFormValid()} className="px-4 py-2 text-sm font-medium text-white bg-brand-blue rounded-md shadow-sm hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:bg-gray-400 disabled:cursor-not-allowed">
            Submit Feedback
          </button>
        </div>
      </form>
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4"
      aria-labelledby="feedback-modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto transform transition-all p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 'category' ? renderCategorySelector() : renderForm()}
      </div>
    </div>
  );
};

export default FeedbackModal;