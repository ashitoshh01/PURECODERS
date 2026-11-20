import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

/**
 * Creates and launches the interactive Echo spotlight tour.
 * 
 * @param {Object} options
 * @param {Function} options.onSelectTab - Callback to switch active tabs (risk, interview, handover, ask)
 * @param {Function} options.onOpenSidebar - Callback to ensure sidebar is expanded
 * @param {Function} [options.onComplete] - Optional completion callback
 */
export function startEchoTour({ onSelectTab, onOpenSidebar, onComplete }) {
  // Ensure the sidebar is open so the target navigation items are in the DOM and visible
  if (typeof onOpenSidebar === 'function') {
    onOpenSidebar(true);
  }

  const driverObj = driver({
    animate: true,
    overlayColor: '#0f172a',
    overlayOpacity: 0.7,
    stagePadding: 6,
    stageRadius: 10,
    popoverClass: 'echo-tour-popover',
    showProgress: true,
    progressText: '{{current}} of {{total}}',
    nextBtnText: 'Next →',
    prevBtnText: '← Back',
    doneBtnText: 'Finish Tour',
    allowClose: true,
    smoothScroll: true,
    onDestroyed: () => {
      if (typeof onComplete === 'function') {
        onComplete();
      }
    },
    steps: [
      {
        popover: {
          title: 'Welcome to Echo',
          description: `
            <div class="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <p>Echo is your automated <strong>Knowledge-Risk Engine</strong> that prevents critical codebase knowledge from disappearing when team members depart.</p>
              <div class="p-2.5 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-950 font-medium text-[11px] leading-snug">
                Take a <strong>1-minute interactive walkthrough</strong> to see how Echo analyzes risk, runs AI interviews, builds handovers, and assists successors.
              </div>
            </div>
          `,
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '#tour-project-selector',
        popover: {
          title: 'Project & Repository Scope',
          description: `
            <div class="space-y-1.5 text-xs text-slate-600 leading-relaxed">
              <p>Switch between the <strong>Simulated Benchmark</strong> (ideal for sandbox testing) or <strong>Connect a Live Git Repo</strong>.</p>
              <p class="text-[11px] text-slate-500">Echo parses commit logs, PR authorship, and churn to analyze who owns what across your codebase.</p>
            </div>
          `,
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '#tour-ingest-btn',
        popover: {
          title: 'Ingest Repositories & Data Sources',
          description: `
            <div class="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>Connect and ingest your <strong>GitHub repositories</strong>, <strong>local Git paths</strong>, <strong>Slack discussion channels</strong>, or <strong>Jira tickets</strong>.</p>
              <div class="p-2 rounded-lg bg-teal-50 border border-teal-200/70 text-[11px] text-teal-900 leading-snug">
                Echo crawls commits, PR discussions, and incident threads to construct an organizational knowledge graph.
              </div>
            </div>
          `,
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '#tour-nav-risk',
        data: { tab: 'risk' },
        popover: {
          title: 'Step 1: Detect Knowledge Risks',
          description: `
            <div class="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>The <strong>Risk Map</strong> identifies single points of failure (bus factor alerts where <strong>≥80%</strong> of commits belong to a single leaver) and flags components with high criticality and deficient documentation.</p>
              <div class="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                Single Point of Failure Detection
              </div>
            </div>
          `,
          side: 'right',
          align: 'center',
        },
      },
      {
        element: '#tour-nav-architecture',
        data: { tab: 'architecture' },
        popover: {
          title: 'Step 2: Architecture & Topology Graph',
          description: `
            <div class="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>Explore an interactive <strong>domain-clustered topology</strong> (CardDemo reference visualization) mapping online transactions, core batch jobs, and shared data stores with single-owner risk halos.</p>
              <div class="inline-flex items-center gap-1.5 text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                Visual Blast Radius
              </div>
            </div>
          `,
          side: 'right',
          align: 'center',
        },
      },
      {
        element: '#tour-nav-interview',
        data: { tab: 'interview' },
        popover: {
          title: 'Step 3: Grounded AI Interviews',
          description: `
            <div class="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>Instead of manual forms, departing engineers take targeted AI interviews. The AI extracts unwritten architectural secrets, deployment caveats, and runbooks.</p>
              <div class="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                Voice & Text Knowledge Capture
              </div>
            </div>
          `,
          side: 'right',
          align: 'center',
        },
      },
      {
        element: '#tour-nav-handover',
        data: { tab: 'handover' },
        popover: {
          title: 'Step 4: Structured Handover Plan',
          description: `
            <div class="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>Automatically compiles interview answers and codebase metadata into an actionable handover package with concrete verification tasks for the incoming successor.</p>
              <div class="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Actionable Successor Roadmap
              </div>
            </div>
          `,
          side: 'right',
          align: 'center',
        },
      },
      {
        element: '#tour-nav-ask',
        data: { tab: 'ask' },
        popover: {
          title: 'Step 5: Ask Echo Copilot',
          description: `
            <div class="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>Successors can chat with Echo to query the preserved knowledge base, understand why design decisions were made, and resolve roadblocks quickly.</p>
              <div class="inline-flex items-center gap-1.5 text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                Grounded Successor Assistant
              </div>
            </div>
          `,
          side: 'right',
          align: 'center',
        },
      },
      {
        element: '#tour-nav-freshness',
        data: { tab: 'freshness' },
        popover: {
          title: 'Step 6: Knowledge Freshness Monitor',
          description: `
            <div class="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>Guards captured institutional knowledge against code rot by automatically detecting conflicts between documented decisions/landmines and live commits/PRs.</p>
              <div class="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Continuous Drift & Contradiction Detection
              </div>
            </div>
          `,
          side: 'right',
          align: 'center',
        },
      },
      {
        element: '#tour-engine-connectors-btn',
        data: { tab: 'risk' },
        popover: {
          title: 'Engine & Connectors Settings',
          description: `
            <div class="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>Configure your <strong>AI Reasoning Engine</strong> (Gemini, Claude, or local LLMs) and manage external credentials.</p>
              <div class="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 leading-snug">
                Set up automated Git sync intervals, Slack webhooks, and Jira connections to keep repository intelligence continuously synchronized.
              </div>
            </div>
          `,
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '#tour-user-menu',
        data: { tab: 'risk' },
        popover: {
          title: 'Role Perspectives',
          description: `
            <div class="space-y-1.5 text-xs text-slate-600 leading-relaxed">
              <p>Echo adapts to your role: <strong>Project Lead</strong>, <strong>Departing Lead</strong>, <strong>Successor</strong>, or <strong>Reviewer</strong>.</p>
              <p class="text-[11px] text-slate-500">Switch perspectives anytime here to see the interface tailored to each role's responsibilities.</p>
            </div>
          `,
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '#tour-how-it-works-btn',
        data: { tab: 'risk' },
        popover: {
          title: 'You\'re All Set!',
          description: `
            <div class="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>You can restart this <strong>"How It Works"</strong> guide at any time by clicking this button in the sidebar.</p>
              <p class="font-semibold text-slate-800">Ready to explore? Dive into the Risk Map or try an AI interview!</p>
            </div>
          `,
          side: 'top',
          align: 'start',
        },
      },
    ],
  });

  driverObj.drive();
  return driverObj;
}
