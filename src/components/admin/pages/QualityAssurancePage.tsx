import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  TrendingUp, 
  Zap,
  RefreshCw,
  Play,
  Eye
} from 'lucide-react';
import QualityAssuranceDashboard from '../monitoring/QualityAssuranceDashboard';
import { useAutomatedTesting } from '@/hooks/useAutomatedTesting';
import { contentQualityAnalyzer } from '@/utils/contentQuality';

export default function QualityAssurancePage() {
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [testContent, setTestContent] = useState('');
  const [testTitle, setTestTitle] = useState('');
  const [qualityResult, setQualityResult] = useState<any>(null);
  
  const { 
    testResults, 
    isRunning, 
    currentTest, 
    runFullTestSuite 
  } = useAutomatedTesting();

  const handleTestContent = () => {
    if (!testContent || !testTitle) return;
    
    const analysis = contentQualityAnalyzer.analyzeContent(testContent, testTitle);
    setQualityResult(analysis);
  };

  const getTestSuiteStatus = () => {
    if (testResults.length === 0) return 'not-run';
    const allPassed = testResults.every(suite => suite.status === 'passed');
    const anyFailed = testResults.some(suite => suite.status === 'failed');
    return allPassed ? 'passed' : anyFailed ? 'failed' : 'warning';
  };

  const getTotalTests = () => {
    return testResults.reduce((sum, suite) => sum + suite.tests.length, 0);
  };

  const getPassedTests = () => {
    return testResults.reduce((sum, suite) => sum + suite.passedCount, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quality Assurance & Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor content quality, system performance, and automated testing results
          </p>
        </div>
        <Button 
          onClick={() => setDashboardOpen(true)}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          Open Full Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* System Health Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="font-semibold text-success">Healthy</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              All systems operational
            </p>
          </CardContent>
        </Card>

        {/* Test Suite Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Test Suite Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getTestSuiteStatus() === 'passed' && <CheckCircle className="h-4 w-4 text-success" />}
              {getTestSuiteStatus() === 'failed' && <XCircle className="h-4 w-4 text-destructive" />}
              {getTestSuiteStatus() === 'warning' && <AlertTriangle className="h-4 w-4 text-warning" />}
              {getTestSuiteStatus() === 'not-run' && <AlertTriangle className="h-4 w-4 text-muted-foreground" />}
              
              <span className="font-semibold capitalize">
                {getTestSuiteStatus() === 'not-run' ? 'Not Run' : getTestSuiteStatus()}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {getTotalTests() > 0 ? `${getPassedTests()}/${getTotalTests()} tests passed` : 'Run tests to see results'}
            </p>
          </CardContent>
        </Card>

        {/* Publishing Success Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Publishing Success</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">94.2%</div>
            <Progress value={94.2} className="mt-2" />
            <p className="text-sm text-muted-foreground mt-1">
              Last 7 days performance
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="testing" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="testing">Automated Testing</TabsTrigger>
          <TabsTrigger value="quality">Content Quality</TabsTrigger>
          <TabsTrigger value="monitoring">System Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Automated Test Suite</CardTitle>
              <CardDescription>
                Run comprehensive tests to validate system functionality and performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button 
                  onClick={runFullTestSuite}
                  disabled={isRunning}
                  className="flex items-center gap-2"
                >
                  {isRunning ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {isRunning ? 'Running Tests...' : 'Run Full Test Suite'}
                </Button>
                
                {isRunning && currentTest && (
                  <span className="text-sm text-muted-foreground">
                    {currentTest}
                  </span>
                )}
              </div>

              {testResults.length > 0 && (
                <div className="space-y-4">
                  {testResults.map((suite) => (
                    <Card key={suite.name} className="border-l-4" style={{
                      borderLeftColor: suite.status === 'passed' ? 'hsl(var(--success))' :
                                     suite.status === 'failed' ? 'hsl(var(--destructive))' :
                                     'hsl(var(--warning))'
                    }}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{suite.name}</CardTitle>
                          <Badge variant={
                            suite.status === 'passed' ? 'default' :
                            suite.status === 'failed' ? 'destructive' : 'secondary'
                          }>
                            {suite.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Total Tests:</span>
                            <div className="font-semibold">{suite.tests.length}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Passed:</span>
                            <div className="font-semibold text-success">{suite.passedCount}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Failed:</span>
                            <div className="font-semibold text-destructive">{suite.failedCount}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Duration:</span>
                            <div className="font-semibold">{(suite.totalDuration / 1000).toFixed(2)}s</div>
                          </div>
                        </div>
                        
                        <div className="mt-4 space-y-2">
                          {suite.tests.map((test) => (
                            <div key={test.id} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                {test.status === 'passed' && <CheckCircle className="h-4 w-4 text-success" />}
                                {test.status === 'failed' && <XCircle className="h-4 w-4 text-destructive" />}
                                {test.status === 'warning' && <AlertTriangle className="h-4 w-4 text-warning" />}
                                <span>{test.testName}</span>
                              </div>
                              <div className="text-muted-foreground">
                                {test.duration}ms
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Quality Analysis</CardTitle>
              <CardDescription>
                Test your content quality with our advanced analysis engine
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Content Title</label>
                  <input
                    type="text"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    placeholder="Enter content title..."
                    className="w-full mt-1 px-3 py-2 border border-input rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Content</label>
                  <textarea
                    value={testContent}
                    onChange={(e) => setTestContent(e.target.value)}
                    placeholder="Enter content to analyze..."
                    rows={4}
                    className="w-full mt-1 px-3 py-2 border border-input rounded-md"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleTestContent}
                disabled={!testContent || !testTitle}
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Analyze Quality
              </Button>

              {qualityResult && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Quality Analysis Results
                      <Badge variant={qualityResult.score >= 80 ? 'default' : qualityResult.score >= 60 ? 'secondary' : 'destructive'}>
                        {qualityResult.score}/100
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-muted-foreground">SEO Score</span>
                        <div className="text-xl font-bold">{qualityResult.seoScore}</div>
                        <Progress value={qualityResult.seoScore} className="mt-1" />
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Readability</span>
                        <div className="text-xl font-bold">{qualityResult.readabilityScore}</div>
                        <Progress value={qualityResult.readabilityScore} className="mt-1" />
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Engagement</span>
                        <div className="text-xl font-bold">{qualityResult.engagementPotential}</div>
                        <Progress value={qualityResult.engagementPotential} className="mt-1" />
                      </div>
                    </div>

                    {qualityResult.issues.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold">Issues Found:</h4>
                        {qualityResult.issues.map((issue: any, index: number) => (
                          <Alert key={index} variant={issue.type === 'error' ? 'destructive' : 'default'}>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{issue.message}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    )}

                    {qualityResult.recommendations.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="font-semibold">Recommendations:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {qualityResult.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="text-sm text-muted-foreground">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Publishing Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Success Rate</span>
                    <span className="font-semibold text-success">94.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Processing Time</span>
                    <span className="font-semibold">2.3s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Published</span>
                    <span className="font-semibold">156</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Failed Posts</span>
                    <span className="font-semibold text-destructive">9</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health Checks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Database Connection</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm text-success">Healthy</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Edge Functions</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm text-success">Operational</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Content Pipeline</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm text-success">Running</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>API Integrations</span>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <span className="text-sm text-warning">Degraded</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              <strong>Recommendation:</strong> API integrations showing slight degradation. 
              Consider increasing timeout values and implementing retry mechanisms for better reliability.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>

      <QualityAssuranceDashboard 
        isOpen={dashboardOpen}
        onClose={() => setDashboardOpen(false)}
      />
    </div>
  );
}