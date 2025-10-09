import React from 'react';
import { SafetyTopic } from '../../types';
import Modal from '../Modal';
import DocumentTextIcon from '../icons/DocumentTextIcon';

interface TopicPreviewModalProps {
    topic: SafetyTopic | null;
    onClose: () => void;
}

const TopicPreviewModal: React.FC<TopicPreviewModalProps> = ({ topic, onClose }) => {
    if (!topic) {
        return null;
    }

    return (
        <Modal isOpen={!!topic} onClose={onClose} title={topic.name}>
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Description</h3>
                    <p className="mt-1 text-gray-700">{topic.content}</p>
                </div>
                <div>
                     <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Official Document</h3>
                     <a
                        href={topic.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center space-x-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
                    >
                        <DocumentTextIcon className="h-5 w-5" />
                        <span>View PDF</span>
                    </a>
                </div>
                <div className="pt-4 flex justify-end">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default TopicPreviewModal;
