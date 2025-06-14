import { useState } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import axios from 'axios';

const PLAN_OPTIONS = [
    { label: 'Double Major', value: 1, fields: ['Major 1 [Paste Academic Calendar Link]', 'Major 2 [Paste Academic Calendar Link]'] },
    { label: 'Major + Minor', value: 2, fields: ['Major [Paste Academic Calendar Link]', 'Minor [Paste Academic Calendar Link]'] },
    { label: 'Major + Double Minor', value: 3, fields: ['Major [Paste Academic Calendar Link]', 'Minor 1 [Paste Academic Calendar Link]', 'Minor 2 [Paste Academic Calendar Link]'] },
    { label: 'Specialization', value: 4, fields: ['Specialization [Paste Academic Calendar Link]'] },
    { label: 'Specialization + Minor', value: 5, fields: ['Specialization [Paste Academic Calendar Link]', 'Minor [Paste Academic Calendar Link]'] },
    { label: 'Major Only (Old Plan)', value: 6, fields: ['Major [Paste Academic Calendar Link]'] },
];

export default function SelectPlan() {
    const [selectedPlan, setSelectedPlan] = useState(PLAN_OPTIONS[0].value);
    const [fields, setFields] = useState(Array(PLAN_OPTIONS[0].fields.length).fill(''));
    const [locked, setLocked] = useState(Array(PLAN_OPTIONS[0].fields.length).fill(false));
    const [responses, setResponses] = useState(Array(PLAN_OPTIONS[0].fields.length).fill(null));
    const [errors, setErrors] = useState(Array(PLAN_OPTIONS[0].fields.length).fill(null));

    const apiUrl = import.meta.env.VITE_API_URL;

    const handlePlanChange = (e) => {
        const planValue = Number(e.target.value);
        const plan = PLAN_OPTIONS.find(opt => opt.value === planValue);
        setSelectedPlan(planValue);
        setFields(Array(plan.fields.length).fill(''));
        setLocked(Array(plan.fields.length).fill(false));
        setResponses(Array(plan.fields.length).fill(null));
        setErrors(Array(plan.fields.length).fill(null));
    };

    const handleFieldChange = (idx, value) => {
        const newFields = [...fields];
        newFields[idx] = value;
        setFields(newFields);
    };

    const validateUrl = (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const validateResponse = (response, planType, fieldType) => {
        const title = response.title?.toLowerCase() || '';
        const planTypeLower = planType.toLowerCase();
        
        if (planTypeLower.includes('major') && !title.includes('major')) {
            return false;
        }
        if (planTypeLower.includes('minor') && !title.includes('minor')) {
            return false;
        }
        if (planTypeLower.includes('specialization') && !title.includes('specialization')) {
            return false;
        }
        return true;
    };

    const handleLock = async (idx) => {
        const url = fields[idx].trim();
        if (!url) {
            const newErrors = [...errors];
            newErrors[idx] = "Please enter a URL";
            setErrors(newErrors);
            return;
        }

        if (!validateUrl(url)) {
            const newErrors = [...errors];
            newErrors[idx] = "Please enter a valid URL";
            setErrors(newErrors);
            return;
        }

        try {
            const response = await axios.get(`${apiUrl}/backend/coursePlan?url=${encodeURIComponent(url)}`);
            
            const planType = PLAN_OPTIONS.find(opt => opt.value === selectedPlan).label;
            const fieldType = PLAN_OPTIONS.find(opt => opt.value === selectedPlan).fields[idx];
            
            if (!validateResponse(response.data, planType, fieldType)) {
                const newErrors = [...errors];
                newErrors[idx] = `Invalid plan type. Expected ${fieldType.split(' ')[0].trim()}`;
                setErrors(newErrors);
                return;
            }

            const newResponses = [...responses];
            newResponses[idx] = response.data;
            setResponses(newResponses);

            const newLocked = [...locked];
            newLocked[idx] = true;
            setLocked(newLocked);

            const newErrors = [...errors];
            newErrors[idx] = null;
            setErrors(newErrors);
        } catch (error) {
            const newErrors = [...errors];
            newErrors[idx] = error.response?.data?.message || "An error occurred while fetching the plan";
            setErrors(newErrors);
        }
    };

    const handleUnlock = (idx) => {
        const newLocked = [...locked];
        const newFields = [...fields];
        const newResponses = [...responses];
        const newErrors = [...errors];
        newLocked[idx] = false;
        newFields[idx] = '';
        newResponses[idx] = null;
        newErrors[idx] = null;
        setLocked(newLocked);
        setFields(newFields);
        setResponses(newResponses);
        setErrors(newErrors);
    };

    const handleKeyDown = (e, idx) => {
        if (e.key === 'Enter' && fields[idx].trim() && !locked[idx]) {
            handleLock(idx);
        }
    };

    const plan = PLAN_OPTIONS.find(opt => opt.value === selectedPlan);

    return (
        <div className='flex flex-col p-3 border rounded-lg'>
            <div className='text-xl font-bold mb-2 lg:mt-0 mt-2'>Select Plan</div>
            <div className='flex items-center mb-4'>
                <label className='mr-3 font-medium'>Type:</label>
                <select
                    className='border rounded px-3 py-1 text-base w-full'
                    value={selectedPlan}
                    onChange={handlePlanChange}
                >
                    {PLAN_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-3 w-full'>
                {plan.fields.map((placeholder, idx) => (
                    <div key={idx} className='flex flex-col w-full'>
                        <div className='flex w-full'>
                            <input
                                type='text'
                                className={`border rounded px-3 py-1 text-base flex-1 transition-all duration-150 mr-2 ${locked[idx] ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : ''}`}
                                placeholder={placeholder}
                                value={fields[idx]}
                                onChange={e => handleFieldChange(idx, e.target.value)}
                                onKeyDown={e => handleKeyDown(e, idx)}
                                disabled={locked[idx]}
                                style={{ minWidth: 0 }}
                            />
                            {!locked[idx] && fields[idx].trim() && (
                                <button
                                    className='bg-green-500 hover:bg-green-600 text-white rounded flex items-center justify-center transition-colors duration-150'
                                    style={{ width: 32, height: 32 }}
                                    onClick={() => handleLock(idx)}
                                    tabIndex={-1}
                                >
                                    <FaCheck size={16} />
                                </button>
                            )}
                            {locked[idx] && (
                                <button
                                    className='bg-gray-400 hover:bg-gray-500 text-white rounded flex items-center justify-center transition-colors duration-150 ml-1'
                                    style={{ width: 32, height: 32 }}
                                    onClick={() => handleUnlock(idx)}
                                    tabIndex={-1}
                                >
                                    <FaTimes size={16} />
                                </button>
                            )}
                        </div>
                        {errors[idx] && (
                            <div className='text-red-500 text-sm mt-1'>{errors[idx]}</div>
                        )}
                        {responses[idx] && (
                            <div className='mt-2 p-3 bg-gray-100 rounded-lg'>
                                <pre className='whitespace-pre-wrap text-sm'>
                                    {JSON.stringify(responses[idx], null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}