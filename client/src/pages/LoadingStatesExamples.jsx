import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonProductCard,
  SkeletonStatsCard,
  SkeletonProfile,
  SkeletonListItem,
  SkeletonForm,
  SkeletonGrid,
  SkeletonDashboard,
  ButtonLoading,
  ContentLoading,
  ProgressBar,
  StepIndicator,
  PulseLoader,
  RefreshIndicator,
  InlineStatus,
  CardLoading
} from '../components/loadingStatesIndex';
import { useOptimistic } from '../hooks/useOptimistic';
import { showSuccess, showError } from '../utils/errorHandler';

const LoadingStatesExamples = () => {
  const [buttonLoading, setButtonLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);

  // Optimistic updates example
  const { 
    data: items, 
    optimisticAdd, 
    optimisticUpdate, 
    optimisticDelete 
  } = useOptimistic([
    { id: 1, name: 'Item 1', status: 'active' },
    { id: 2, name: 'Item 2', status: 'active' },
    { id: 3, name: 'Item 3', status: 'inactive' }
  ]);

  const handleButtonClick = async () => {
    setButtonLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setButtonLoading(false);
    showSuccess('Action completed!');
  };

  const handleContentLoad = async (shouldError = false) => {
    setContentLoading(true);
    setContentError(false);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (shouldError) {
      setContentError(true);
    }
    setContentLoading(false);
  };

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
    showSuccess('Content refreshed!');
  };

  const handleOptimisticAdd = async () => {
    try {
      await optimisticAdd(
        { name: `Item ${items.length + 1}`, status: 'active' },
        async (item) => {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1500));
          return { ...item, id: Date.now() };
        }
      );
      showSuccess('Item added!');
    } catch (error) {
      showError('Failed to add item');
    }
  };

  const handleOptimisticUpdate = async (id) => {
    try {
      const item = items.find(i => i.id === id);
      await optimisticUpdate(
        id,
        { status: item.status === 'active' ? 'inactive' : 'active' },
        async (id, updates) => {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1500));
          return { ...item, ...updates };
        }
      );
      showSuccess('Item updated!');
    } catch (error) {
      showError('Failed to update item');
    }
  };

  const handleOptimisticDelete = async (id) => {
    try {
      await optimisticDelete(id, async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
      });
      showSuccess('Item deleted!');
    } catch (error) {
      showError('Failed to delete item');
    }
  };

  const toggleCardLoading = async () => {
    setCardLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setCardLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Loading States Examples</h1>
          <p className="text-gray-600 mt-2">
            Examples of skeleton loaders, loading indicators, and optimistic UI updates
          </p>
        </div>

        {/* Skeleton Loaders */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">1. Skeleton Loaders</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Basic Skeleton</h3>
              <Skeleton className="h-8 w-64" />
            </div>

            <div>
              <h3 className="font-semibold mb-3">Text Skeleton</h3>
              <SkeletonText lines={3} />
            </div>

            <div>
              <h3 className="font-semibold mb-3">Card Skeleton</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <SkeletonCard />
                <SkeletonProductCard />
                <SkeletonStatsCard />
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Table Skeleton</h3>
              <SkeletonTable rows={3} columns={4} />
            </div>

            <div>
              <h3 className="font-semibold mb-3">Profile Skeleton</h3>
              <SkeletonProfile />
            </div>

            <div>
              <h3 className="font-semibold mb-3">List Skeleton</h3>
              <div className="space-y-3">
                <SkeletonListItem />
                <SkeletonListItem />
                <SkeletonListItem />
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Form Skeleton</h3>
              <SkeletonForm fields={4} />
            </div>

            <div>
              <h3 className="font-semibold mb-3">Grid Skeleton</h3>
              <SkeletonGrid items={6} columns={3} ItemComponent={SkeletonProductCard} />
            </div>
          </div>
        </section>

        {/* Loading Indicators */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">2. Loading Indicators</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Button Loading</h3>
              <div className="flex gap-3">
                <ButtonLoading
                  loading={buttonLoading}
                  onClick={handleButtonClick}
                  className="btn-primary"
                  loadingText="Processing..."
                >
                  Click Me
                </ButtonLoading>
                <button onClick={handleButtonClick} className="btn-secondary">
                  Trigger Loading
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Content Loading</h3>
              <div className="flex gap-3 mb-4">
                <button onClick={() => handleContentLoad(false)} className="btn-primary">
                  Load Content
                </button>
                <button onClick={() => handleContentLoad(true)} className="btn-secondary">
                  Load with Error
                </button>
              </div>
              
              <ContentLoading
                loading={contentLoading}
                error={contentError ? new Error('Failed to load content') : null}
                loadingComponent={<SkeletonDashboard />}
              >
                <div className="p-6 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Content Loaded Successfully!</h4>
                  <p className="text-gray-600">This is your actual content.</p>
                </div>
              </ContentLoading>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Progress Bar</h3>
              <button onClick={simulateProgress} className="btn-primary mb-4">
                Start Progress
              </button>
              <ProgressBar progress={progress} />
            </div>

            <div>
              <h3 className="font-semibold mb-3">Step Indicator</h3>
              <div className="mb-6 pt-4">
                <StepIndicator
                  steps={['Select Plan', 'Enter Details', 'Payment', 'Confirm']}
                  currentStep={currentStep}
                />
              </div>
              <div className="flex gap-3 mt-8">
                <button 
                  onClick={handlePrevStep} 
                  disabled={currentStep === 0}
                  className="btn-secondary"
                >
                  Previous
                </button>
                <button 
                  onClick={handleNextStep}
                  disabled={currentStep === 3}
                  className="btn-primary"
                >
                  Next
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Pulse Loader</h3>
              <PulseLoader />
            </div>

            <div>
              <h3 className="font-semibold mb-3">Refresh Indicator</h3>
              <RefreshIndicator refreshing={refreshing} onRefresh={handleRefresh} />
            </div>

            <div>
              <h3 className="font-semibold mb-3">Inline Status</h3>
              <div className="space-y-3">
                <InlineStatus status="loading" text="Loading data..." />
                <InlineStatus status="success" text="Data loaded successfully" />
                <InlineStatus status="error" text="Failed to load data" />
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Card Loading</h3>
              <button onClick={toggleCardLoading} className="btn-primary mb-4">
                Toggle Card Loading
              </button>
              <CardLoading loading={cardLoading}>
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="font-semibold mb-2">Card Content</h4>
                  <p className="text-gray-600">This card can have a loading overlay.</p>
                </div>
              </CardLoading>
            </div>
          </div>
        </section>

        {/* Optimistic Updates */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">3. Optimistic UI Updates</h2>
          
          <p className="text-gray-600 mb-4">
            Changes appear instantly in the UI, then sync with the server in the background.
            If the server request fails, changes are automatically rolled back.
          </p>

          <button onClick={handleOptimisticAdd} className="btn-primary mb-4">
            Add Item (Optimistic)
          </button>

          <div className="space-y-3">
            {items.map(item => (
              <div
                key={item.id || item._id}
                className={`
                  flex items-center justify-between p-4 rounded-lg border-2
                  ${item.isOptimistic ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{item.name}</span>
                  <span
                    className={`
                      px-2 py-1 rounded text-xs font-medium
                      ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                    `}
                  >
                    {item.status}
                  </span>
                  {item.isOptimistic && (
                    <span className="text-xs text-blue-600">Syncing...</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOptimisticUpdate(item.id || item._id)}
                    className="btn-secondary text-sm"
                  >
                    Toggle Status
                  </button>
                  <button
                    onClick={() => handleOptimisticDelete(item.id || item._id)}
                    className="btn-secondary text-sm text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features List */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">✨ Features Implemented</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-green-600">Skeleton Loaders</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>✅ Base Skeleton component</li>
                <li>✅ Text skeleton (multi-line)</li>
                <li>✅ Card skeletons (3 variants)</li>
                <li>✅ Table skeleton</li>
                <li>✅ Profile skeleton</li>
                <li>✅ List item skeleton</li>
                <li>✅ Form skeleton</li>
                <li>✅ Grid skeleton (responsive)</li>
                <li>✅ Dashboard skeleton</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-green-600">Loading Indicators</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>✅ Button loading state</li>
                <li>✅ Content loading wrapper</li>
                <li>✅ Progress bar with percentage</li>
                <li>✅ Multi-step indicator</li>
                <li>✅ Pulse loader (animated dots)</li>
                <li>✅ Refresh indicator</li>
                <li>✅ Inline status icons</li>
                <li>✅ Card loading overlay</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-green-600">Optimistic Updates</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>✅ useOptimistic hook</li>
                <li>✅ Optimistic add with rollback</li>
                <li>✅ Optimistic update with rollback</li>
                <li>✅ Optimistic delete with rollback</li>
                <li>✅ Automatic error recovery</li>
                <li>✅ Visual sync indicators</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-green-600">Custom Hooks</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>✅ useOptimistic</li>
                <li>✅ useOptimisticAction</li>
                <li>✅ useLoadingState</li>
                <li>✅ useMultipleLoadingStates</li>
                <li>✅ useAsyncState</li>
                <li>✅ useDebouncedLoading</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default LoadingStatesExamples;
