import React, { useState, useEffect } from 'react';
import { Plug, RefreshCw, ExternalLink, CheckCircle2, Clock, Globe } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorState from '../components/feedback/ErrorState';
import integrationService from '../services/integrationService';

export function IntegrationsPage() {
  const [data, setData] = useState(null);
  const [limit, setLimit] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchExternalTasks = async (limitVal = limit) => {
    setLoading(true);
    setError(null);
    try {
      const res = await integrationService.getExternalTasks(limitVal);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch external tasks from JSONPlaceholder.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExternalTasks(limit);
  }, [limit]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">External Integrations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Live ingestion from external REST provider (JSONPlaceholder) normalized into WorkPulse tasks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchExternalTasks(limit)}
            loading={loading}
            icon={RefreshCw}
          >
            Sync Feed
          </Button>
          <a
            href="https://jsonplaceholder.typicode.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 font-medium"
          >
            <span>Upstream Source</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Provider Details Card */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">JSONPlaceholder Todos API</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                https://jsonplaceholder.typicode.com/todos • Timeout: 10s • Public API
              </p>
            </div>
          </div>

          <div className="w-36">
            <Select
              label="Fetch Limit"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              options={[
                { value: 5, label: '5 items' },
                { value: 10, label: '10 items' },
                { value: 20, label: '20 items' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Ingested Items List */}
      {loading ? (
        <div className="py-12">
          <LoadingSpinner label="Ingesting and transforming external feed..." />
        </div>
      ) : error ? (
        <ErrorState
          title="Integration Sync Failed"
          message={error}
          onRetry={() => fetchExternalTasks(limit)}
        />
      ) : data?.items && data.items.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
            <span>Transformed Tasks ({data.count} items)</span>
            <span>Source: {data.source}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.items.map((item) => (
              <Card key={item.external_id} className="p-4 hover:border-slate-300">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      EXT-{item.external_id}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-800 capitalize mt-0.5">
                      {item.title}
                    </h4>
                  </div>
                  <StatusBadge status={item.completed ? 'completed' : 'pending'} />
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Provider: {item.source}</span>
                  <span className="text-slate-500 font-medium">
                    {item.completed ? 'Completed upstream' : 'Pending upstream'}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
              <Plug className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No external tasks available</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              The external provider returned an empty collection or the items could not be transformed.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchExternalTasks(limit)}
              icon={RefreshCw}
            >
              Sync Again
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default IntegrationsPage;
