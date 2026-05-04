import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag, Zap, Store, Package, Globe,
  CheckCircle2, XCircle, Loader2, RefreshCw, AlertTriangle,
  Plug, Unplug, Clock,
} from 'lucide-react';
import { analyticsService, type MarketplaceConnection } from '../../services/analytics.service';
import toast from 'react-hot-toast';

// ─── Platform config ──────────────────────────────────────────────────────────

interface PlatformMeta {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  category: string;
}

const PLATFORMS: PlatformMeta[] = [
  {
    key: 'AMAZON',
    label: 'Amazon Seller Central',
    description: 'Sync sales, inventory, and performance metrics from your Amazon storefront.',
    icon: <ShoppingBag size={28} />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    category: 'Marketplace',
  },
  {
    key: 'SHOPIFY',
    label: 'Shopify',
    description: 'Connect your Shopify store to track D2C orders, revenue, and customer insights.',
    icon: <Store size={28} />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    category: 'D2C Store',
  },
  {
    key: 'FLIPKART',
    label: 'Flipkart Seller Hub',
    description: 'Import Flipkart sales data, glance views, and competitive pricing signals.',
    icon: <Package size={28} />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    category: 'Marketplace',
  },
  {
    key: 'MEESHO',
    label: 'Meesho Supplier',
    description: 'Track Meesho reseller performance and social commerce sales trends.',
    icon: <Zap size={28} />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    category: 'Social Commerce',
  },
  {
    key: 'D2C',
    label: 'Custom D2C Website',
    description: 'Connect your direct-to-consumer website for unified analytics.',
    icon: <Globe size={28} />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    category: 'D2C Store',
  },
];

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === 'CONNECTED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
        <CheckCircle2 size={12} />
        Connected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
      <XCircle size={12} />
      Disconnected
    </span>
  );
}

// ─── Platform card ────────────────────────────────────────────────────────────

interface PlatformCardProps {
  meta: PlatformMeta;
  connection: MarketplaceConnection | null;
  onConnect: (key: string) => void;
  onDisconnect: (key: string) => void;
  connecting: boolean;
}

function PlatformCard({ meta, connection, onConnect, onDisconnect, connecting }: PlatformCardProps) {
  const isConnected = connection?.status === 'CONNECTED';

  return (
    <div
      className={`relative bg-white rounded-2xl border-2 transition-all duration-200 p-6 flex flex-col gap-4
        ${isConnected ? `${meta.borderColor} shadow-md` : 'border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'}`}
    >
      {/* Category chip */}
      <div className="absolute top-4 right-4">
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
          {meta.category}
        </span>
      </div>

      {/* Icon + title */}
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-xl ${meta.bgColor} ${meta.color} flex items-center justify-center flex-shrink-0`}>
          {meta.icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-base">{meta.label}</h3>
          <StatusBadge status={connection?.status ?? 'DISCONNECTED'} />
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-500 leading-relaxed">{meta.description}</p>

      {/* Connected info */}
      {isConnected && connection?.connectedAt && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Clock size={12} />
          Connected {new Date(connection.connectedAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </div>
      )}

      {/* Mock token note */}
      {isConnected && connection?.mockToken && (
        <div className="text-xs bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg font-mono truncate">
          {connection.mockToken}
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto pt-2">
        {isConnected ? (
          <button
            onClick={() => onDisconnect(meta.key)}
            disabled={connecting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 font-medium text-sm transition-colors disabled:opacity-50"
          >
            <Unplug size={16} />
            Disconnect
          </button>
        ) : (
          <button
            onClick={() => onConnect(meta.key)}
            disabled={connecting}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all disabled:opacity-50
              ${meta.bgColor} ${meta.color} border-2 ${meta.borderColor} hover:shadow-sm`}
          >
            {connecting ? <Loader2 size={16} className="animate-spin" /> : <Plug size={16} />}
            {connecting ? 'Connecting…' : 'Connect'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BuyerIntegrationsPage() {
  const [connections, setConnections] = useState<MarketplaceConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null); // platform key being connected

  const load = useCallback(async () => {
    try {
      const data = await analyticsService.listConnections();
      setConnections(data);
    } catch {
      toast.error('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleConnect = async (platform: string) => {
    setConnecting(platform);
    // Simulate 2-second "OAuth handshake" animation
    await new Promise(r => setTimeout(r, 2000));
    try {
      const conn = await analyticsService.connectPlatform(platform);
      setConnections(prev => {
        const idx = prev.findIndex(c => c.platform === platform);
        return idx >= 0 ? prev.map(c => c.platform === platform ? conn : c) : [...prev, conn];
      });
      toast.success(`${platform} connected! 30-day history is being generated…`, { duration: 4000 });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Connection failed';
      toast.error(msg);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platform: string) => {
    try {
      await analyticsService.disconnectPlatform(platform);
      setConnections(prev =>
        prev.map(c => c.platform === platform ? { ...c, status: 'DISCONNECTED', mockToken: null } : c)
      );
      toast.success(`${platform} disconnected`);
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  const connectedCount = connections.filter(c => c.status === 'CONNECTED').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketplace Integrations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Connect your sales channels to unlock AI-powered insights and analytics.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Platforms Available', value: PLATFORMS.length, color: 'text-gray-900' },
          { label: 'Connected', value: connectedCount, color: 'text-emerald-600' },
          { label: 'Disconnected', value: PLATFORMS.length - connectedCount, color: 'text-gray-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Info banner when no connections */}
      {connectedCount === 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5 text-amber-500" />
          <p>
            Connect at least one platform to start seeing sales analytics, glance view trends, and
            AI-powered price intelligence on your dashboard.
          </p>
        </div>
      )}

      {/* Platform grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {PLATFORMS.map(meta => {
          const connection = connections.find(c => c.platform === meta.key) ?? null;
          return (
            <PlatformCard
              key={meta.key}
              meta={meta}
              connection={connection}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              connecting={connecting === meta.key}
            />
          );
        })}
      </div>

      {/* Security note */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 text-xs text-gray-500">
        <strong className="text-gray-700">Mock Mode Active —</strong> No real API credentials are required.
        Equinox simulates OAuth handshakes and generates representative sales data for analytics and reporting.
        Real connector integrations will be available in Phase 2.
      </div>
    </div>
  );
}
