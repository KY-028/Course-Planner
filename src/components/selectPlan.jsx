import { useState } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';

const PLAN_OPTIONS = [
    { label: 'Double Major', value: 1, fields: ['Major 1', 'Major 2'] },
    { label: 'Major + Minor', value: 2, fields: ['Major', 'Minor'] },
    { label: 'Major + Double Minor', value: 3, fields: ['Major', 'Minor 1', 'Minor 2'] },
    { label: 'Specialization', value: 4, fields: ['Specialization'] },
    { label: 'Specialization + Minor', value: 5, fields: ['Specialization', 'Minor'] },
    { label: 'Major Only (Old Plan)', value: 6, fields: ['Major'] },
];

export default function SelectPlan() {
    const [selectedPlan, setSelectedPlan] = useState(PLAN_OPTIONS[0].value);
    const [fields, setFields] = useState(Array(PLAN_OPTIONS[0].fields.length).fill(''));
    const [locked, setLocked] = useState(Array(PLAN_OPTIONS[0].fields.length).fill(false));

    const handlePlanChange = (e) => {
        const planValue = Number(e.target.value);
        const plan = PLAN_OPTIONS.find(opt => opt.value === planValue);
        setSelectedPlan(planValue);
        setFields(Array(plan.fields.length).fill(''));
        setLocked(Array(plan.fields.length).fill(false));
    };

    const handleFieldChange = (idx, value) => {
        const newFields = [...fields];
        newFields[idx] = value;
        setFields(newFields);
    };

    const handleLock = (idx) => {
        const newLocked = [...locked];
        newLocked[idx] = true;
        setLocked(newLocked);
    };

    const handleUnlock = (idx) => {
        const newLocked = [...locked];
        const newFields = [...fields];
        newLocked[idx] = false;
        newFields[idx] = '';
        setLocked(newLocked);
        setFields(newFields);
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
                    <div key={idx} className='flex items-center w-full'>
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
                    </div>
                ))}
            </div>
        </div>
    );
}