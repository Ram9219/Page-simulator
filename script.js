document.addEventListener('DOMContentLoaded', function () {
    const runSimulation = document.getElementById('runSimulation');
    runSimulation.addEventListener('click', simulate);
});

function simulate() {
    // Get input values
    const frameCount = parseInt(document.getElementById('frameCount').value);
    const refString = document.getElementById('refString').value
        .split(',')
        .map(item => parseInt(item.trim()))
        .filter(item => !isNaN(item));

    // Check which algorithms to run
    const algorithms = [];
    if (document.getElementById('fifoCheck').checked) algorithms.push('FIFO');
    if (document.getElementById('lruCheck').checked) algorithms.push('LRU');
    if (document.getElementById('optCheck').checked) algorithms.push('OPT');
    if (document.getElementById('clockCheck').checked) algorithms.push('Clock');

    if (algorithms.length === 0) {
        alert('Please select at least one algorithm to compare');
        return;
    }

    // Run simulations
    const results = {};
    algorithms.forEach(alg => {
        results[alg] = runAlgorithm(alg, frameCount, refString);
    });

    // Display results
    displayResults(results, refString);
}

function runAlgorithm(algorithm, frameCount, refString) {
    switch (algorithm) {
        case 'FIFO': return fifo(frameCount, refString);
        case 'LRU': return lru(frameCount, refString);
        case 'OPT': return opt(frameCount, refString);
        case 'Clock': return clock(frameCount, refString);
        default: return null;
    }
}

// FIFO Algorithm Implementation
function fifo(frameCount, refString) {
    const frames = [];
    const history = [];
    const steps = [];
    let pageFaults = 0;

    for (const page of refString) {
        const step = { page, frames: [...frames], fault: false, replaced: null };

        if (!frames.includes(page)) {
            step.fault = true;
            pageFaults++;

            if (frames.length < frameCount) {
                frames.push(page);
                history.push(page);
            } else {
                const toReplace = history.shift();
                const index = frames.indexOf(toReplace);
                frames[index] = page;
                history.push(page);
                step.replaced = toReplace;
            }
        }

        steps.push(step);
    }

    return { steps, pageFaults };
}

// LRU Algorithm Implementation
function lru(frameCount, refString) {
    const frames = [];
    const lastUsed = {};
    const steps = [];
    let pageFaults = 0;

    for (let i = 0; i < refString.length; i++) {
        const page = refString[i];
        const step = { page, frames: [...frames], fault: false, replaced: null };

        if (!frames.includes(page)) {
            step.fault = true;
            pageFaults++;

            if (frames.length < frameCount) {
                frames.push(page);
            } else {
                let lruPage = null;
                let minTime = Infinity;

                for (const frame of frames) {
                    if (lastUsed[frame] < minTime) {
                        minTime = lastUsed[frame];
                        lruPage = frame;
                    }
                }

                const index = frames.indexOf(lruPage);
                frames[index] = page;
                step.replaced = lruPage;
            }
        }

        lastUsed[page] = i;
        steps.push(step);
    }

    return { steps, pageFaults };
}

// OPT Algorithm Implementation
function opt(frameCount, refString) {
    const frames = [];
    const steps = [];
    let pageFaults = 0;

    for (let i = 0; i < refString.length; i++) {
        const page = refString[i];
        const step = { page, frames: [...frames], fault: false, replaced: null };

        if (!frames.includes(page)) {
            step.fault = true;
            pageFaults++;

            if (frames.length < frameCount) {
                frames.push(page);
            } else {
                let farthest = -1;
                let toReplace = null;

                for (const frame of frames) {
                    let nextUse = Infinity;

                    for (let j = i + 1; j < refString.length; j++) {
                        if (refString[j] === frame) {
                            nextUse = j;
                            break;
                        }
                    }

                    if (nextUse === Infinity) {
                        toReplace = frame;
                        break;
                    }

                    if (nextUse > farthest) {
                        farthest = nextUse;
                        toReplace = frame;
                    }
                }

                const index = frames.indexOf(toReplace);
                frames[index] = page;
                step.replaced = toReplace;
            }
        }

        steps.push(step);
    }

    return { steps, pageFaults };
}

// Clock Algorithm Implementation
function clock(frameCount, refString) {
    const frames = [];
    const refBits = [];
    let pointer = 0;
    const steps = [];
    let pageFaults = 0;

    for (const page of refString) {
        const step = { page, frames: [...frames], fault: false, replaced: null };

        const frameIndex = frames.indexOf(page);
        if (frameIndex !== -1) {
            refBits[frameIndex] = 1;
        } else {
            step.fault = true;
            pageFaults++;

            if (frames.length < frameCount) {
                frames.push(page);
                refBits.push(1);
                pointer = (pointer + 1) % frameCount;
            } else {
                while (true) {
                    if (refBits[pointer] === 0) {
                        step.replaced = frames[pointer];
                        frames[pointer] = page;
                        refBits[pointer] = 1;
                        pointer = (pointer + 1) % frameCount;
                        break;
                    } else {
                        refBits[pointer] = 0;
                        pointer = (pointer + 1) % frameCount;
                    }
                }
            }
        }

        steps.push(step);
    }

    return { steps, pageFaults };
}

function displayResults(results, refString) {
    const resultsDiv = document.getElementById('results');
    const summaryDiv = document.getElementById('summary');
    const detailsDiv = document.getElementById('details');

    // Show results section
    resultsDiv.classList.remove('hidden');

    // Generate summary
    let summaryHTML = `
        <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="font-medium text-lg mb-2">Summary</h3>
            <p class="mb-2"><span class="font-medium">Reference String:</span> ${refString.join(', ')}</p>
            <div class="grid grid-cols-1 md:grid-cols-${Object.keys(results).length} gap-4 mt-4">
    `;

    for (const [alg, result] of Object.entries(results)) {
        summaryHTML += `
            <div class="bg-white p-3 rounded shadow-sm border border-gray-200">
                <h4 class="font-medium text-center ${getAlgorithmColor(alg)}">${alg}</h4>
                <p class="text-center mt-2"><span class="font-medium">Page Faults:</span> ${result.pageFaults}</p>
            </div>
        `;
    }

    summaryHTML += `</div></div>`;
    summaryDiv.innerHTML = summaryHTML;

    // Generate detailed steps
    detailsDiv.innerHTML = '<h3 class="font-medium text-lg mb-4">Detailed Steps</h3>';

    for (const [alg, result] of Object.entries(results)) {
        detailsDiv.innerHTML += `
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-medium text-lg mb-3 ${getAlgorithmColor(alg)}">${alg} Algorithm</h4>
                <div class="overflow-x-auto">
                    <table class="min-w-full bg-white border border-gray-200">
                        <thead>
                            <tr class="bg-gray-100">
                                <th class="py-2 px-4 border-b">Step</th>
                                <th class="py-2 px-4 border-b">Page</th>
                                <th class="py-2 px-4 border-b">Frames</th>
                                <th class="py-2 px-4 border-b">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${result.steps.map((step, i) => `
                                <tr class="${step.fault ? 'bg-red-50' : ''}">
                                    <td class="py-2 px-4 border-b text-center">${i + 1}</td>
                                    <td class="py-2 px-4 border-b text-center">${step.page}</td>
                                    <td class="py-2 px-4 border-b text-center">[${step.frames.join(', ')}]</td>
                                    <td class="py-2 px-4 border-b text-center">
                                        ${step.fault 
                                            ? (step.replaced !== null 
                                                ? `Page Fault - Replaced ${step.replaced}` 
                                                : 'Page Fault - Loaded')
                                            : 'Hit'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // Render graph
    renderGraph(results);

    // Scroll to results
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
}

function renderGraph(results) {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    const labels = Object.keys(results);
    const data = labels.map(alg => results[alg].pageFaults);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Page Faults',
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ${context.raw}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Page Faults'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Algorithms'
                    }
                }
            }
        }
    });
}

function getAlgorithmColor(algorithm) {
    const colors = {
        'FIFO': 'text-red-600',
        'LRU': 'text-blue-600',
        'OPT': 'text-green-600',
        'Clock': 'text-purple-600'
    };
    return colors[algorithm] || 'text-gray-600';
}