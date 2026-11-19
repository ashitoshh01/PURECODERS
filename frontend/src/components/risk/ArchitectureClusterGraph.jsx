import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Search,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Database,
  FileCode,
  Info,
  X,
  Sparkles,
  RefreshCw,
  ChevronDown,
  Check,
  Layers,
  ShieldAlert,
  GitBranch,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { echoApi } from '../../api';

// Canonical cluster centers on a 1200x960 virtual coordinate space
const CARDDEMO_CLUSTER_CENTERS = {
  data_stores: { x: 600, y: 460, r: 125, labelY: -135 },
  batch_infra: { x: 340, y: 220, r: 95, labelY: -105 },
  ims_mq: { x: 630, y: 240, r: 75, labelY: -85 },
  db2_ext: { x: 910, y: 240, r: 90, labelY: -100 },
  core_batch: { x: 880, y: 530, r: 105, labelY: -115 },
  txn_bill: { x: 920, y: 760, r: 80, labelY: -90 },
  acct_cust: { x: 600, y: 780, r: 110, labelY: -120 },
  card_mgmt: { x: 370, y: 780, r: 85, labelY: -95 },
  user_sec: { x: 210, y: 680, r: 75, labelY: -85 },
  reporting: { x: 180, y: 410, r: 75, labelY: -85 },
};

export default function ArchitectureClusterGraph({
  activeProject,
  onNavigateToInterview,
  currentUser,
  activeTab,
}) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const zoomBehaviorRef = useRef(null);

  // Data states
  const [datasetType, setDatasetType] = useState('carddemo'); // 'carddemo' | 'workspace'
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // Interactive filter & selection states
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClusterFilter, setSelectedClusterFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all'); // 'all' | 'high_risk' | 'bus_factor'
  const [showLegend, setShowLegend] = useState(false);

  // Custom styled dropdown open states and refs
  const [clusterDropdownOpen, setClusterDropdownOpen] = useState(false);
  const [riskDropdownOpen, setRiskDropdownOpen] = useState(false);
  const clusterDropdownRef = useRef(null);
  const riskDropdownRef = useRef(null);

  // Notice popup: shows every time user visits the architecture endpoint
  const [showBenchmarkNotice, setShowBenchmarkNotice] = useState(false);

  useEffect(() => {
    if (activeTab === 'architecture' || !activeTab) {
      setShowBenchmarkNotice(true);
    }
  }, [activeTab]);

  const handleDismissNotice = () => {
    setShowBenchmarkNotice(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (clusterDropdownRef.current && !clusterDropdownRef.current.contains(event.target)) {
        setClusterDropdownOpen(false);
      }
      if (riskDropdownRef.current && !riskDropdownRef.current.contains(event.target)) {
        setRiskDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Safe dataset switching: resets stale dropdown filters so new workspace is never dimmed
  const handleSwitchDataset = (type) => {
    if (type === datasetType) return;
    setDatasetType(type);
    setSelectedClusterFilter('all');
    setRiskFilter('all');
    setSearchQuery('');
    setSelectedNode(null);
    setHoveredNode(null);
    setClusterDropdownOpen(false);
    setRiskDropdownOpen(false);
  };

  // Load graph data from backend endpoint
  const loadGraph = async (type = datasetType) => {
    setLoading(true);
    setErr(null);
    try {
      const pId = activeProject?.id;
      const res = await echoApi.getClusterViz(pId, type);
      setGraphData(res);
      setSelectedNode(null);
      setHoveredNode(null);
    } catch (e) {
      setErr(e.message || 'Failed to load architecture cluster data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph(datasetType);
  }, [datasetType, activeProject?.id]);

  // Validate cluster filter against newly loaded dataset clusters
  useEffect(() => {
    if (graphData?.clusters && selectedClusterFilter !== 'all') {
      const exists = graphData.clusters.some((c) => c.id === selectedClusterFilter);
      if (!exists) {
        setSelectedClusterFilter('all');
      }
    }
  }, [graphData, selectedClusterFilter]);

  // Derive cluster positions (CardDemo static centers or dynamic auto-expanding radial layout)
  const clusterLayoutMap = useMemo(() => {
    if (!graphData?.clusters) return {};

    const map = {};
    const clusters = graphData.clusters;
    const isCardDemo = graphData.dataset_type === 'carddemo';

    if (isCardDemo) {
      clusters.forEach((c) => {
        map[c.id] = CARDDEMO_CLUSTER_CENTERS[c.id] || { x: 600, y: 480, r: 80, labelY: -90 };
      });
      return map;
    }

    // Dynamic radial distribution with Auto-Expanding Cluster Radii (Option 1 + Option 2)
    // 1. Calculate required area per cluster based on member node radii
    const clusterAreaSum = {};
    const clusterNodeCount = {};
    (graphData.nodes || []).forEach((n) => {
      const cid = n.cluster_id || 'unknown';
      clusterNodeCount[cid] = (clusterNodeCount[cid] || 0) + 1;
      const nr = n.radius || 15;
      // Area required per circle with collision buffer
      clusterAreaSum[cid] = (clusterAreaSum[cid] || 0) + Math.PI * Math.pow(nr + 3.2, 2);
    });

    const getDynamicRadius = (cid, isCenter = false) => {
      const count = clusterNodeCount[cid] || 0;
      const area = clusterAreaSum[cid] || 0;
      if (count === 0) return isCenter ? 85 : 55;
      // Circle packing formula: R = sqrt(sum(node_area)/pi) * 1.35 + buffer
      const packedR = Math.sqrt(area / Math.PI) * 1.35;
      if (isCenter) {
        return Math.max(85, Math.min(145, Math.round(packedR) + 14));
      }
      return Math.max(58, Math.min(130, Math.round(packedR) + 12));
    };

    const centerX = 600;
    const centerY = 505;
    const centerR = getDynamicRadius('data_stores', true);
    map['data_stores'] = { x: centerX, y: centerY, r: centerR, labelY: -centerR - 10 };

    const otherClusters = clusters.filter((c) => c.id !== 'data_stores');
    const count = otherClusters.length;

    // Angle offset: offset by half a slice so NO cluster sits at exactly 12 o'clock,
    // keeping the top center clear for the Master System Title!
    const angleOffset = -Math.PI / 2 + Math.PI / Math.max(1, count);
    const outerRadius = 315;

    otherClusters.forEach((c, idx) => {
      const angle = (idx / Math.max(1, count)) * 2 * Math.PI + angleOffset;
      const cx = centerX + outerRadius * Math.cos(angle);
      const cy = centerY + outerRadius * Math.sin(angle);
      const r = getDynamicRadius(c.id, false);
      map[c.id] = { x: Math.round(cx), y: Math.round(cy), r, labelY: -r - 10 };
    });

    return map;
  }, [graphData]);

  // Connected nodes & edges calculation for active highlight
  const activeFocusId = hoveredNode?.id || selectedNode?.id;

  const connectedInfo = useMemo(() => {
    if (!activeFocusId || !graphData?.edges) {
      return { nodeIds: new Set(), edgeIds: new Set(), inDegree: 0, outDegree: 0 };
    }

    const nodeIds = new Set([activeFocusId]);
    const edgeIds = new Set();
    let inDegree = 0;
    let outDegree = 0;

    graphData.edges.forEach((e) => {
      const srcId = typeof e.source === 'object' ? e.source.id : e.source;
      const tgtId = typeof e.target === 'object' ? e.target.id : e.target;

      if (srcId === activeFocusId) {
        nodeIds.add(tgtId);
        edgeIds.add(e.id);
        outDegree++;
      } else if (tgtId === activeFocusId) {
        nodeIds.add(srcId);
        edgeIds.add(e.id);
        inDegree++;
      }
    });

    return { nodeIds, edgeIds, inDegree, outDegree };
  }, [activeFocusId, graphData]);

  // Main D3 Rendering Effect (Light & Minimal Theme)
  useEffect(() => {
    if (!graphData || !svgRef.current || loading) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');

    // Subtle drop shadow filter for active nodes in light theme
    const shadowFilter = defs
      .append('filter')
      .attr('id', 'light-node-shadow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');
    shadowFilter.append('feDropShadow')
      .attr('dx', '0')
      .attr('dy', '2')
      .attr('stdDeviation', '3')
      .attr('flood-color', '#0f172a')
      .attr('flood-opacity', '0.12');

    // High risk halo filter
    const highRiskFilter = defs
      .append('filter')
      .attr('id', 'rose-halo')
      .attr('x', '-40%')
      .attr('y', '-40%')
      .attr('width', '180%')
      .attr('height', '180%');
    highRiskFilter.append('feDropShadow')
      .attr('dx', '0')
      .attr('dy', '0')
      .attr('stdDeviation', '4')
      .attr('flood-color', '#f43f5e')
      .attr('flood-opacity', '0.45');

    // Master container for zoom & pan
    const masterGroup = svg.append('g').attr('class', 'master-zoom-group');

    // Minimal Light Background
    masterGroup
      .append('rect')
      .attr('x', -800)
      .attr('y', -600)
      .attr('width', 2800)
      .attr('height', 2200)
      .attr('fill', '#fcfdfd');

    // Outer System Boundary Circle (Darker, well-defined circular dashed line)
    masterGroup
      .append('circle')
      .attr('cx', 600)
      .attr('cy', 505)
      .attr('r', 450)
      .attr('fill', 'none')
      .attr('stroke', '#475569')
      .attr('stroke-width', 2.0)
      .attr('stroke-dasharray', '8 12')
      .attr('stroke-opacity', 0.85);

    // Master System Title Badge at Top of Boundary
    const titleGroup = masterGroup.append('g').attr('class', 'system-title-badge');
    const titleText = graphData.system_name || 'System Architecture';
    const badgeW = Math.max(180, titleText.length * 10 + 44);

    titleGroup
      .append('rect')
      .attr('x', 600 - badgeW / 2)
      .attr('y', 24)
      .attr('width', badgeW)
      .attr('height', 34)
      .attr('rx', 10)
      .attr('fill', '#ffffff')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1.2)
      .attr('filter', 'url(#light-node-shadow)');

    titleGroup
      .append('text')
      .attr('x', 600)
      .attr('y', 46)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', '800')
      .attr('font-family', 'ui-sans-serif, system-ui, sans-serif')
      .attr('letter-spacing', '0.03em')
      .attr('fill', '#0f172a')
      .text(titleText);

    // Render Cluster Boundary Circles and Labels (Darker, High-Contrast Dashed Rings)
    const clusterGroup = masterGroup.append('g').attr('class', 'cluster-boundaries');

    graphData.clusters.forEach((c) => {
      const pos = clusterLayoutMap[c.id] || { x: 600, y: 480, r: 85, labelY: -95 };

      // Cluster boundary circle with darker dashed line for every circular domain
      clusterGroup
        .append('circle')
        .attr('cx', pos.x)
        .attr('cy', pos.y)
        .attr('r', pos.r)
        .attr('fill', c.color ? `${c.color}0e` : 'rgba(241, 245, 249, 0.65)')
        .attr('stroke', c.border_color || '#334155')
        .attr('stroke-width', 2.0)
        .attr('stroke-opacity', 0.9)
        .attr('stroke-dasharray', '5 10');

      // Cluster Title Label directly above cluster
      clusterGroup
        .append('text')
        .attr('x', pos.x)
        .attr('y', pos.y + (pos.labelY || -pos.r - 10))
        .attr('text-anchor', 'middle')
        .attr('font-size', c.id === 'data_stores' ? '14px' : '12.5px')
        .attr('font-weight', '800')
        .attr('font-family', 'ui-sans-serif, system-ui, sans-serif')
        .attr('letter-spacing', '0.01em')
        .attr('fill', '#0f172a')
        .text(c.name);
    });

    // Prepare Node data for simulation
    const simulationNodes = graphData.nodes.map((n) => {
      const clusterPos = clusterLayoutMap[n.cluster_id] || { x: 600, y: 480, r: 60 };
      const angle = Math.random() * 2 * Math.PI;
      const radius = Math.random() * (clusterPos.r * 0.65);
      return {
        ...n,
        x: clusterPos.x + radius * Math.cos(angle),
        y: clusterPos.y + radius * Math.sin(angle),
        targetX: clusterPos.x,
        targetY: clusterPos.y,
        clusterR: clusterPos.r,
      };
    });

    const nodeById = new Map(simulationNodes.map((d) => [d.id, d]));

    // Prepare Links data
    const simulationLinks = graphData.edges
      .map((e) => ({
        ...e,
        source: nodeById.get(typeof e.source === 'object' ? e.source.id : e.source),
        target: nodeById.get(typeof e.target === 'object' ? e.target.id : e.target),
      }))
      .filter((e) => e.source && e.target);

    // Edges group (Light subtle slate lines with clear visibility)
    const linkGroup = masterGroup.append('g').attr('class', 'edges-layer');
    const links = linkGroup
      .selectAll('line')
      .data(simulationLinks)
      .enter()
      .append('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1.0)
      .attr('stroke-opacity', 0.45);

    // Nodes group
    const nodeGroup = masterGroup.append('g').attr('class', 'nodes-layer');
    const nodeElements = nodeGroup
      .selectAll('g.node')
      .data(simulationNodes)
      .enter()
      .append('g')
      .attr('class', 'node cursor-pointer')
      .attr('filter', 'url(#light-node-shadow)')
      .on('mouseenter', (event, d) => {
        setHoveredNode(d);
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
      });

    // Outer warning ring for high risk / bus factor 1 hotspots
    nodeElements
      .filter((d) => d.risk_tier === 'critical' || d.bus_factor_one)
      .append('circle')
      .attr('r', (d) => d.radius + 3.8)
      .attr('fill', 'none')
      .attr('stroke', '#e11d48')
      .attr('stroke-width', 2.2)
      .attr('filter', 'url(#rose-halo)')
      .attr('opacity', 0.95);

    // Main Node Circle (Richer, darker tones with slightly darker crisp borders)
    nodeElements
      .append('circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) => d.color || '#0284c7')
      .attr('stroke', (d) => d.border_color || d3.color(d.color || '#0284c7').darker(0.65).formatHex())
      .attr('stroke-width', 2.0)
      .attr('opacity', 1.0);

    // Subtle inner highlight sheen for tactile depth
    nodeElements
      .append('circle')
      .attr('r', (d) => Math.max(1, d.radius - 1.8))
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255, 255, 255, 0.22)')
      .attr('stroke-width', 1.0)
      .attr('pointer-events', 'none');

    // Node Text Label (Crisp bold monospace with hover tooltip)
    nodeElements
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', (d) => (d.radius > 22 ? '10px' : d.radius > 16 ? '8.5px' : '7px'))
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
      .attr('font-weight', '800')
      .attr('letter-spacing', '-0.02em')
      .attr('fill', '#ffffff')
      .attr('pointer-events', 'none')
      .text((d) => {
        if (d.radius < 11.5) return '';
        const name = d.name || d.id;
        const maxLen = d.radius > 20 ? 9 : 7;
        return name.length > maxLen ? name.substring(0, maxLen - 1) + '…' : name;
      });

    // Native SVG hover tooltip for instant inspection
    nodeElements.append('title').text((d) => `${d.name} (${d.title})\nDomain: ${d.cluster_name}\nRisk: ${d.risk_pct}%\nOwner: ${d.primary_owner}`);

    // Force simulation with collision relaxation
    const simulation = d3
      .forceSimulation(simulationNodes)
      .force('x', d3.forceX((d) => d.targetX).strength(0.35))
      .force('y', d3.forceY((d) => d.targetY).strength(0.35))
      .force('charge', d3.forceManyBody().strength(-15))
      .force('collide', d3.forceCollide((d) => d.radius + 3.0).iterations(3))
      .force('link', d3.forceLink(simulationLinks).id((d) => d.id).strength(0.04))
      .alpha(0.85)
      .alphaDecay(0.035);

    simulation.on('tick', () => {
      simulationNodes.forEach((d) => {
        const dx = d.x - d.targetX;
        const dy = d.y - d.targetY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.max(8, d.clusterR - d.radius - 3);

        if (dist > maxDist) {
          const angle = Math.atan2(dy, dx);
          d.x = d.targetX + maxDist * Math.cos(angle);
          d.y = d.targetY + maxDist * Math.sin(angle);
        }
      });

      links
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);

      nodeElements.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    // Zoom & Pan
    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 3.5])
      .on('zoom', (event) => {
        masterGroup.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;
    svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1));

    svg.on('click', () => {
      setSelectedNode(null);
    });

    return () => {
      simulation.stop();
    };
  }, [graphData, clusterLayoutMap, loading]);

  // Dynamic visual highlighting effect when hovered or selected
  useEffect(() => {
    if (!svgRef.current || !graphData) return;

    const svg = d3.select(svgRef.current);
    const activeId = hoveredNode?.id || selectedNode?.id;
    const { nodeIds, edgeIds } = connectedInfo;

    const matchesFilter = (d) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (d.name || '').toLowerCase().includes(q);
        const matchesTitle = (d.title || '').toLowerCase().includes(q);
        const matchesId = (d.id || '').toLowerCase().includes(q);
        if (!matchesName && !matchesTitle && !matchesId) return false;
      }

      if (selectedClusterFilter !== 'all' && d.cluster_id !== selectedClusterFilter) {
        return false;
      }

      if (riskFilter === 'high_risk' && d.risk_score < 0.3) {
        return false;
      }
      if (riskFilter === 'bus_factor' && !d.bus_factor_one) {
        return false;
      }

      return true;
    };

    // Update nodes
    svg.selectAll('g.node').each(function (d) {
      const el = d3.select(this);
      const isMatch = matchesFilter(d);

      if (!isMatch) {
        el.transition().duration(150).attr('opacity', 0.15);
        return;
      }

      if (!activeId) {
        el.transition().duration(150).attr('opacity', 1.0);
      } else {
        const isConnected = nodeIds.has(d.id);
        el.transition()
          .duration(150)
          .attr('opacity', isConnected ? 1.0 : 0.18);
      }
    });

    // Update links (Teal highlight on hover)
    svg.selectAll('.edges-layer line').each(function (d) {
      const el = d3.select(this);

      if (!activeId) {
        el.attr('stroke', '#94a3b8')
          .attr('stroke-width', 1.0)
          .attr('stroke-opacity', 0.45);
      } else {
        const isEdgeConnected = edgeIds.has(d.id);
        if (isEdgeConnected) {
          el.attr('stroke', '#0f766e')
            .attr('stroke-width', 2.6)
            .attr('stroke-opacity', 1.0)
            .raise();
        } else {
          el.attr('stroke', '#e2e8f0').attr('stroke-width', 0.5).attr('stroke-opacity', 0.08);
        }
      }
    });
  }, [hoveredNode, selectedNode, connectedInfo, searchQuery, selectedClusterFilter, riskFilter, graphData]);

  // Zoom helpers
  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.7);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(400).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white text-slate-800 select-none relative font-sans overflow-hidden">
      {/* Clean Minimal Light Header Toolbar */}
      <div className="px-5 py-3 bg-white border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-3 shrink-0 z-20 shadow-2xs">
        {/* Left: Minimal Segmented Dataset Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => handleSwitchDataset('carddemo')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                datasetType === 'carddemo'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="CardDemo 50-node reference mainframe architecture"
            >
              CardDemo Reference
            </button>
            <button
              onClick={() => handleSwitchDataset('workspace')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                datasetType === 'workspace'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Live project workspace repository with calculated AST risk scores"
            >
              Current Workspace
            </button>
          </div>
        </div>

        {/* Right: Quick search & Custom Styled Filters */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search component..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 w-32 sm:w-40 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Custom Domain Cluster Filter Dropdown */}
          <div className="relative hidden md:block" ref={clusterDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setClusterDropdownOpen((prev) => !prev);
                setRiskDropdownOpen(false);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                selectedClusterFilter !== 'all'
                  ? 'bg-teal-50 border-teal-300 text-teal-900 shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
              title="Filter components by domain cluster"
              aria-haspopup="listbox"
              aria-expanded={clusterDropdownOpen}
            >
              <Layers className={`w-3.5 h-3.5 ${selectedClusterFilter !== 'all' ? 'text-teal-600' : 'text-slate-500'}`} />
              <span className="max-w-[120px] lg:max-w-[160px] truncate">
                {selectedClusterFilter === 'all'
                  ? `All Clusters (${graphData?.clusters?.length || 0})`
                  : (graphData?.clusters?.find((c) => c.id === selectedClusterFilter)?.name || 'Filtered')}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                  clusterDropdownOpen ? 'rotate-180 text-teal-600' : ''
                }`}
              />
            </button>

            {clusterDropdownOpen && (
              <div className="absolute top-full right-0 mt-1.5 z-50 bg-white border border-slate-200/90 rounded-xl shadow-xl overflow-hidden py-1 divide-y divide-slate-100 min-w-[230px] max-w-[290px] animate-in fade-in slide-in-from-top-1">
                <div className="px-3 py-1.5 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Domain Clusters</span>
                  <span className="font-mono text-slate-500">{graphData?.clusters?.length || 0}</span>
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {/* All Clusters Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClusterFilter('all');
                      setClusterDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-xs text-left flex items-center justify-between transition hover:bg-slate-50 cursor-pointer ${
                      selectedClusterFilter === 'all'
                        ? 'bg-teal-50/80 text-teal-900 font-bold'
                        : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                      <span>All Clusters ({graphData?.clusters?.length || 0})</span>
                    </div>
                    {selectedClusterFilter === 'all' && (
                      <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    )}
                  </button>

                  {/* Individual Clusters */}
                  {graphData?.clusters?.map((c) => {
                    const isSelected = selectedClusterFilter === c.id;
                    const nodeCount = graphData.nodes?.filter((n) => n.cluster_id === c.id).length || 0;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedClusterFilter(c.id);
                          setClusterDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-xs text-left flex items-center justify-between transition hover:bg-slate-50 cursor-pointer ${
                          isSelected
                            ? 'bg-teal-50/80 text-teal-900 font-bold'
                            : 'text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
                            style={{ backgroundColor: c.color || '#64748b' }}
                          />
                          <span className="truncate">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                            {nodeCount}
                          </span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Custom Risk Tier Filter Dropdown */}
          <div className="relative" ref={riskDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setRiskDropdownOpen((prev) => !prev);
                setClusterDropdownOpen(false);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                riskFilter !== 'all'
                  ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
              title="Filter components by risk tier"
              aria-haspopup="listbox"
              aria-expanded={riskDropdownOpen}
            >
              <ShieldAlert className={`w-3.5 h-3.5 ${riskFilter !== 'all' ? 'text-rose-600' : 'text-slate-500'}`} />
              <span className="truncate">
                {riskFilter === 'all'
                  ? 'All Risk Tiers'
                  : riskFilter === 'high_risk'
                  ? 'High Risk (≥30%)'
                  : 'Bus Factor = 1'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                  riskDropdownOpen ? 'rotate-180 text-rose-600' : ''
                }`}
              />
            </button>

            {riskDropdownOpen && (
              <div className="absolute top-full right-0 mt-1.5 z-50 bg-white border border-slate-200/90 rounded-xl shadow-xl overflow-hidden py-1 divide-y divide-slate-100 min-w-[195px] animate-in fade-in slide-in-from-top-1">
                <div className="px-3 py-1.5 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Filter Risk Tiers
                </div>
                <div className="py-1">
                  {[
                    { id: 'all', label: 'All Risk Tiers', color: 'bg-slate-400' },
                    { id: 'high_risk', label: 'High Risk (≥30%)', color: 'bg-rose-500' },
                    { id: 'bus_factor', label: 'Bus Factor = 1', color: 'bg-amber-500' },
                  ].map((opt) => {
                    const isSelected = riskFilter === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setRiskFilter(opt.id);
                          setRiskDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-xs text-left flex items-center justify-between transition hover:bg-slate-50 cursor-pointer ${
                          isSelected ? 'bg-teal-50/80 text-teal-900 font-bold' : 'text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${opt.color} shrink-0`} />
                          <span>{opt.label}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowLegend((v) => !v)}
            className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
              showLegend
                ? 'bg-teal-50 border-teal-200 text-teal-800'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
            title="Toggle legend and color code explanation"
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowBenchmarkNotice(true)}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-200 text-slate-500 hover:text-teal-800 text-xs transition cursor-pointer"
            title="Benchmark Demo vs Live Repository Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area (Full Height, Edge-to-Edge) */}
      <div ref={containerRef} className="flex-1 w-full h-full relative overflow-hidden bg-white">
        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-xs z-30">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-7 h-7 text-teal-600 animate-spin" />
              <p className="text-xs font-semibold text-slate-600">
                Generating clustered architectural topology...
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {err && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl shadow-md">
            {err}
          </div>
        )}

        {/* D3 SVG Canvas */}
        <svg
          ref={svgRef}
          viewBox="0 0 1200 960"
          className="w-full h-full cursor-grab active:cursor-grabbing bg-white"
          preserveAspectRatio="xMidYMid meet"
        />

        {/* Floating Zoom & Pan Controls (Bottom-Right) */}
        <div className="absolute bottom-5 right-5 flex flex-col gap-1.5 bg-white/95 border border-slate-200 backdrop-blur-md p-1.5 rounded-xl shadow-lg z-20">
          <button
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition cursor-pointer"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition cursor-pointer"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-full h-px bg-slate-200 my-0.5" />
          <button
            onClick={handleResetZoom}
            className="p-1.5 hover:bg-teal-50 text-teal-700 hover:text-teal-900 rounded-lg transition cursor-pointer flex items-center justify-center group"
            title="Re-center Graph View"
            aria-label="Re-center Graph View"
          >
            <Crosshair className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Clean Telemetry Ribbon (Bottom-Left) */}
        <div className="absolute bottom-5 left-5 hidden sm:flex items-center gap-4 px-3.5 py-2 bg-white/95 border border-slate-200/90 backdrop-blur-md rounded-xl text-xs text-slate-600 shadow-md z-20">
          <div>
            <span className="font-bold text-slate-900 font-mono">
              {graphData?.summary?.total_nodes ?? 0}
            </span>{' '}
            <span>components</span>
          </div>
          <span className="text-slate-300">|</span>
          <div>
            <span className="font-bold text-slate-900 font-mono">
              {graphData?.summary?.total_clusters ?? 0}
            </span>{' '}
            <span>domains</span>
          </div>
          <span className="text-slate-300">|</span>
          <div>
            <span className="font-bold text-rose-600 font-mono">
              {graphData?.summary?.high_risk_count ?? 0}
            </span>{' '}
            <span>high risk</span>
          </div>
          <span className="text-slate-300">|</span>
          <div>
            <span className="font-bold text-amber-600 font-mono">
              {graphData?.summary?.bus_factor_count ?? 0}
            </span>{' '}
            <span>bus factor = 1</span>
          </div>
          <span className="text-slate-300">|</span>
          <div>
            <span className="font-bold text-emerald-600 font-mono">
              {graphData?.summary?.data_store_count ?? 0}
            </span>{' '}
            <span>data stores</span>
          </div>
        </div>

        {/* Clean Light Floating Tooltip */}
        {hoveredNode && !selectedNode && (
          <div className="absolute top-5 left-5 max-w-xs bg-white/95 border border-slate-200 p-3 rounded-xl shadow-xl backdrop-blur-md pointer-events-none z-30 transition-all animate-fadeIn">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span className="text-[11px] font-bold text-teal-800 font-mono">
                {hoveredNode.id}
              </span>
              <span
                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                  hoveredNode.risk_tier === 'critical'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : hoveredNode.risk_tier === 'high'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-teal-50 text-teal-800 border border-teal-200'
                }`}
              >
                {hoveredNode.risk_pct}% Risk
              </span>
            </div>

            <p className="text-xs font-semibold text-slate-900 leading-tight mb-2">
              {hoveredNode.title || hoveredNode.name}
            </p>

            <div className="space-y-1 text-[11px] text-slate-600 border-t border-slate-100 pt-2">
              <div className="flex justify-between">
                <span>Domain:</span>
                <span className="text-slate-900 font-medium">{hoveredNode.cluster_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Bus Factor:</span>
                <span
                  className={
                    hoveredNode.bus_factor_one ? 'text-rose-600 font-bold' : 'text-emerald-700'
                  }
                >
                  {hoveredNode.bus_factor_one ? '1 (Single Point of Failure)' : 'Distributed'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Primary Owner:</span>
                <span className="text-slate-900">{hoveredNode.primary_owner || 'Team'}</span>
              </div>
              <div className="flex justify-between">
                <span>Dependencies:</span>
                <span className="text-teal-700 font-mono font-bold">
                  {connectedInfo.inDegree + connectedInfo.outDegree} links
                </span>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-teal-700 font-mono">Click to inspect details</p>
          </div>
        )}

        {/* Legend (Light Minimal) */}
        {showLegend && (
          <div className="absolute top-5 right-5 w-72 bg-white/95 border border-slate-200 p-4 rounded-xl shadow-xl backdrop-blur-md z-30 text-xs text-slate-600 animate-fadeIn">
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <Info className="w-4 h-4 text-teal-600" />
                <span>Architecture Legend</span>
              </div>
              <button
                onClick={() => setShowLegend(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Component Domains
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-700 border border-emerald-800 shrink-0" />
                    <span>Data stores</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-sky-600 border border-sky-700 shrink-0" />
                    <span>Online CICS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-fuchsia-700 border border-fuchsia-800 shrink-0" />
                    <span>Core Batch</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-600 border border-amber-700 shrink-0" />
                    <span>Card & Mgmt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-violet-700 border border-violet-800 shrink-0" />
                    <span>Batch Utilities</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-pink-700 border border-pink-800 shrink-0" />
                    <span>IMS / MQ</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Risk Indicators
                </p>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-rose-500 bg-rose-50 shrink-0" />
                    <span>Red Halo = Bus Factor 1 Hotspot</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300 bg-slate-100 shrink-0" />
                    <span>Larger Bubble = High Criticality</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-0.5 bg-teal-600 shrink-0" />
                    <span>Teal Line = Direct Call / Access Dependency</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clean Light Slide-over Inspector Drawer */}
        {selectedNode && (
          <div className="absolute top-0 right-0 h-full w-full sm:w-96 bg-white/95 border-l border-slate-200 backdrop-blur-xl p-5 shadow-2xl flex flex-col justify-between z-40 animate-slideInRight">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shadow-xs shrink-0"
                    style={{ backgroundColor: selectedNode.color || '#0ea5e9' }}
                  >
                    {selectedNode.is_data_store ? (
                      <Database className="w-4 h-4" />
                    ) : (
                      <FileCode className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-mono leading-tight">
                      {selectedNode.name || selectedNode.id}
                    </h3>
                    <p className="text-[11px] text-slate-500">{selectedNode.cluster_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  title="Close Inspector"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Title */}
              <div className="mt-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Full Artifact Title
                </span>
                <p className="text-xs font-semibold text-slate-800 mt-0.5 leading-relaxed">
                  {selectedNode.title || selectedNode.name}
                </p>
              </div>

              {/* Risk & Telemetry Badges */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90">
                  <span className="text-[10px] text-slate-500 block">Risk Exposure</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-bold font-mono text-slate-900">
                      {selectedNode.risk_pct}%
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        selectedNode.risk_score >= 0.3 ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {selectedNode.risk_tier}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90">
                  <span className="text-[10px] text-slate-500 block">Bus Factor</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span
                      className={`text-xl font-bold font-mono ${
                        selectedNode.bus_factor_one ? 'text-rose-600' : 'text-slate-800'
                      }`}
                    >
                      {selectedNode.bus_factor_one ? '1' : '>1'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {selectedNode.bus_factor_one ? 'Single Owner' : 'Shared'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Factor Breakdown */}
              <div className="mt-4 p-3 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Exposure Drivers
                </span>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-600">Single Ownership:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {Math.round((selectedNode.ownership_concentration || 0.8) * 100)}% (
                    {selectedNode.primary_owner || 'Departing Lead'})
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-600">System Criticality:</span>
                  <span className="font-mono font-bold text-amber-700">
                    {selectedNode.criticality || 4} / 5
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-600">Doc Gap:</span>
                  <span className="font-mono font-bold text-rose-700">
                    {Math.round((selectedNode.doc_gap || 0.7) * 100)}% Missing
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-600">Connected Links:</span>
                  <span className="font-mono font-bold text-teal-700">
                    {connectedInfo.inDegree + connectedInfo.outDegree} Connections
                  </span>
                </div>
              </div>

              {/* Connected Dependencies list */}
              <div className="mt-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Direct Dependencies ({connectedInfo.nodeIds.size - 1})
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-xs">
                  {graphData.edges
                    .filter((e) => {
                      const s = typeof e.source === 'object' ? e.source.id : e.source;
                      const t = typeof e.target === 'object' ? e.target.id : e.target;
                      return s === selectedNode.id || t === selectedNode.id;
                    })
                    .map((e) => {
                      const s = typeof e.source === 'object' ? e.source.id : e.source;
                      const t = typeof e.target === 'object' ? e.target.id : e.target;
                      const otherId = s === selectedNode.id ? t : s;
                      const isOutbound = s === selectedNode.id;

                      return (
                        <div
                          key={e.id}
                          className="p-1.5 bg-slate-50 rounded-lg border border-slate-200/90 flex items-center justify-between text-[11px]"
                        >
                          <span className="text-slate-800 font-mono font-medium">{otherId}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600">
                            {isOutbound ? '→ calls' : '← called by'} ({e.relation})
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Actions at bottom of Drawer */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <button
                onClick={() => {
                  if (onNavigateToInterview) {
                    onNavigateToInterview(selectedNode.id);
                  }
                }}
                className="w-full py-2 px-3 text-xs font-bold text-teal-950 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                <span>Launch Exit Interview for this Module</span>
              </button>

              <button
                onClick={() => setSelectedNode(null)}
                className="w-full py-1.5 px-3 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 rounded-xl transition border border-slate-200 cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        )}

        {/* Shorter Benchmark vs Live Repository Onboarding Popup */}
        {showBenchmarkNotice && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
              {/* Top Accent Strip */}
              <div className="h-1.5 w-full bg-linear-to-r from-teal-500 via-cyan-500 to-indigo-500" />
              
              <div className="p-4 sm:p-5">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-2xs shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        Demo Architecture Notice
                      </h3>
                      <p className="text-[11px] text-slate-400">CardDemo Benchmark</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDismissNotice}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-2.5 text-xs text-slate-600">
                  <p className="leading-relaxed">
                    This default view shows <strong>benchmark demo data</strong> so you can see how architectural clustering, data stores, and bus factor risks operate.
                  </p>

                  <div className="p-2.5 bg-teal-50 border border-teal-200/90 rounded-xl text-teal-900 flex items-start gap-2.5">
                    <GitBranch className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-snug">
                      To test with your own live repository, click <strong>Ingest & Connect</strong> in the sidebar, then toggle to <strong>Current Workspace</strong> above!
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleSwitchDataset('workspace');
                      handleDismissNotice();
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Switch to Workspace
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleDismissNotice();
                        window.dispatchEvent(new CustomEvent('echo:open-connect-repo'));
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition cursor-pointer"
                    >
                      Ingest Repo
                    </button>
                    <button
                      type="button"
                      onClick={handleDismissNotice}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#18C6B0] hover:bg-[#0EB8A0] text-slate-950 transition cursor-pointer shadow-xs hover:shadow-sm"
                    >
                      Got it
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
