import { useState } from 'react';

const MIN_SAFE = -9000000000000000000n;
const MAX_SAFE = 9000000000000000000n;

function isDomainMin(v) {
    return typeof v === 'number' ? v <= -9e15 : BigInt(v) <= MIN_SAFE;
}
function isDomainMax(v) {
    return typeof v === 'number' ? v >= 9e15 : BigInt(v) >= MAX_SAFE;
}

function formatLinearExpr(vars, coeffs) {
    if (!vars || vars.length === 0) return '0';
    return vars.map((v, i) => {
        const c = coeffs[i];
        const abs = Math.abs(c);
        const sign = c < 0 ? '−' : (i > 0 ? '+' : '');
        const coefStr = abs === 1 ? '' : `${abs}·`;
        return `${sign ? sign + ' ' : ''}${coefStr}${v}`;
    }).join(' ');
}

function formatDomain(domain) {
    const [lo, hi] = domain;
    if (lo === hi) return `= ${lo}`;
    if (isDomainMin(lo)) return `≤ ${hi}`;
    if (isDomainMax(hi)) return `≥ ${lo}`;
    return `∈ [${lo}, ${hi}]`;
}

function ConstraintLine({ c, index }) {
    const expr = formatLinearExpr(c.vars, c.coeffs);
    const dom = formatDomain(c.domain);
    const enforcement = c.enforcement_literals;

    return (
        <div className="font-mono text-xs leading-relaxed py-0.5 border-b border-gray-100 last:border-0">
            <span className="text-gray-400 mr-2 select-none">{index}.</span>
            {enforcement && (
                <span className="text-purple-400 mr-1">
                    IF {enforcement.join(' ∧ ')} →{' '}
                </span>
            )}
            <span className="text-gray-200">{expr}</span>
            <span className="text-blue-400 ml-1 font-semibold">{dom}</span>
        </div>
    );
}

function CollapsibleSection({ title, count, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="mb-3">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-300 hover:text-white"
            >
                <span className="text-xs">{open ? '▼' : '▶'}</span>
                {title}
                <span className="text-xs font-normal text-gray-400">({count})</span>
            </button>
            {open && <div className="mt-1.5 ml-1 pl-3 border-l-2 border-gray-200">{children}</div>}
        </div>
    );
}

export default function ModelMetadataPanel({ metadata }) {
    if (!metadata) return null;

    const { variables = [], constraints = [], objective, num_variables, num_constraints } = metadata;

    const boolVars = variables.filter(v => v.type === 'bool');
    const intVars = variables.filter(v => v.type === 'int');

    const constraintsByType = {};
    constraints.forEach(c => {
        const hasEnforcement = !!c.enforcement_literals;
        const [lo, hi] = c.domain;
        let category;
        if (hasEnforcement) category = 'Conditional (enforcement)';
        else if (lo === hi && hi === 0) category = 'Equality (sum = 0)';
        else if (lo === hi && hi === 1) category = 'Complement (sum = 1)';
        else if (isDomainMin(lo)) category = 'Conflict / upper bound';
        else category = 'Other';
        if (!constraintsByType[category]) constraintsByType[category] = [];
        constraintsByType[category].push(c);
    });

    return (
        <div className="bg-gray-900 text-gray-200 rounded-lg p-4 text-sm overflow-auto max-h-[70vh]">
            <div className="flex items-center gap-3 mb-4">
                <h3 className="text-base font-bold text-white">CP-SAT Model Metadata</h3>
                <span className="text-xs text-gray-400">
                    {num_variables} vars · {num_constraints} constraints
                </span>
            </div>

            {objective && (
                <div className="mb-4 p-2.5 bg-gray-800 rounded">
                    <div className="text-xs font-semibold text-amber-400 mb-1">
                        Objective ({objective.sense})
                    </div>
                    <div className="font-mono text-xs text-gray-200">
                        {formatLinearExpr(objective.vars, objective.coeffs)}
                    </div>
                    {(objective.offset !== 0 || objective.scaling_factor !== 1) && (
                        <div className="text-xs text-gray-500 mt-0.5">
                            offset={objective.offset}, scale={objective.scaling_factor}
                        </div>
                    )}
                </div>
            )}

            <CollapsibleSection title="Variables" count={variables.length}>
                {boolVars.length > 0 && (
                    <div className="mb-2">
                        <div className="text-xs font-semibold text-green-400 mb-1">
                            Boolean ({boolVars.length})
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {boolVars.map(v => (
                                <span key={v.name} className="font-mono text-xs bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">
                                    {v.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                {intVars.length > 0 && (
                    <div>
                        <div className="text-xs font-semibold text-cyan-400 mb-1">
                            Integer ({intVars.length})
                        </div>
                        {intVars.map(v => (
                            <div key={v.name} className="font-mono text-xs text-gray-300 py-0.5">
                                {v.name} ∈ [{v.domain[0]}, {v.domain[1]}]
                            </div>
                        ))}
                    </div>
                )}
            </CollapsibleSection>

            <CollapsibleSection title="Constraints" count={constraints.length} defaultOpen>
                {Object.entries(constraintsByType).map(([category, items]) => (
                    <div key={category} className="mb-3">
                        <div className="text-xs font-semibold text-teal-400 mb-1">
                            {category} ({items.length})
                        </div>
                        {items.map((c, i) => (
                            <ConstraintLine
                                key={i}
                                c={c}
                                index={constraints.indexOf(c) + 1}
                            />
                        ))}
                    </div>
                ))}
            </CollapsibleSection>
        </div>
    );
}
