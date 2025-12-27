import React, { useState, useEffect } from 'react';
import ApiService from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, BarChart2, PieChart, TrendingUp, Lightbulb, FileText, Activity } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AnalyticsView = ({ open, onOpenChange, filename, language }) => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [insights, setInsights] = useState("");
    const [plots, setPlots] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [reportType, setReportType] = useState('pdf');
    const [generatingReport, setGeneratingReport] = useState(false);

    useEffect(() => {
        if (open && filename) {
            fetchData();
        }
    }, [open, filename]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const statsData = await ApiService.getFileStats(filename, user.token);
            setStats(statsData.stats);

            const plotsData = await ApiService.getVisualizations(filename, user.token);
            setPlots(plotsData.plots);

            fetchInsights();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInsights = async () => {
        setLoadingInsights(true);
        try {
            const data = await ApiService.getDetailedInsights(filename, user.token, language);
            setInsights(data.insights);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingInsights(false);
        }
    };

    const handleDownloadReport = async () => {
        setGeneratingReport(true);
        try {
            const data = await ApiService.generateReport(filename, reportType, user.token, language);
            await downloadBlob(data.download_url, filename, reportType);
        } catch (error) {
            alert("Failed to generate report");
        } finally {
            setGeneratingReport(false);
        }
    };

    const downloadBlob = async (url, originalFilename, type) => {
        try {
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (!response.ok) throw new Error("Download failed");

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `report_${originalFilename.split('.')[0]}.${type}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            console.error("Blob download error", error);
            alert("Download failed");
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[1000px] h-[90vh] overflow-hidden flex flex-col p-0 bg-background border-border">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <Activity className="h-6 w-6 text-primary" />
                        Advanced Analytics: {filename}
                    </DialogTitle>
                    <DialogDescription>
                        Comprehensive statistical analysis, AI insights, and visual trends.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 border-b">
                        <TabsList className="bg-transparent gap-6 h-12 w-full justify-start border-none">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">
                                <FileText className="h-4 w-4 mr-2" /> Summary
                            </TabsTrigger>
                            <TabsTrigger value="visuals" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">
                                <BarChart2 className="h-4 w-4 mr-2" /> Visualizations
                            </TabsTrigger>
                            <TabsTrigger value="insights" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">
                                <Lightbulb className="h-4 w-4 mr-2" /> AI Insights
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1 p-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Activity className="h-10 w-10 animate-spin text-primary/50" />
                                <p className="text-muted-foreground">Analyzing dataset...</p>
                            </div>
                        ) : (
                            <>
                                <TabsContent value="overview" className="m-0 space-y-6">
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {stats && Object.entries(stats).map(([col, colStats]) => (
                                            <Card key={col} className="bg-muted/30 border-border/50">
                                                <CardHeader className="p-4 pb-2">
                                                    <CardTitle className="text-sm font-bold flex justify-between items-center">
                                                        {col}
                                                        <span className="text-[10px] uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                                            {colStats.dtype}
                                                        </span>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-4 pt-0">
                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                                                            <div className="text-muted-foreground">Unique:</div>
                                                            <div className="font-medium text-right">{colStats.unique_count}</div>
                                                            <div className="text-muted-foreground">Nulls:</div>
                                                            <div className="font-medium text-right text-orange-500">{colStats.null_count}</div>
                                                            {colStats.outliers !== undefined && (
                                                                <>
                                                                    <div className="text-muted-foreground">Outliers:</div>
                                                                    <div className={`font-medium text-right ${colStats.outliers > 0 ? 'text-destructive' : ''}`}>{colStats.outliers}</div>
                                                                </>
                                                            )}
                                                        </div>

                                                        {colStats.median !== undefined && (
                                                            <div className="pt-2 border-t border-border/50">
                                                                <div className="text-[10px] font-bold uppercase text-muted-foreground mb-1">5-Number Summary</div>
                                                                <div className="grid grid-cols-5 gap-1 text-[10px] text-center">
                                                                    <div className="bg-muted p-1 rounded">Min<br /><span className="font-bold">{colStats.min}</span></div>
                                                                    <div className="bg-muted p-1 rounded">Q1<br /><span className="font-bold">{colStats.q1}</span></div>
                                                                    <div className="bg-primary/10 p-1 rounded">Med<br /><span className="font-bold">{colStats.median}</span></div>
                                                                    <div className="bg-muted p-1 rounded">Q3<br /><span className="font-bold">{colStats.q3}</span></div>
                                                                    <div className="bg-muted p-1 rounded">Max<br /><span className="font-bold">{colStats.max}</span></div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {colStats.top_values && (
                                                            <div className="pt-2 border-t border-border/50">
                                                                <div className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Top Distributions</div>
                                                                {Object.entries(colStats.top_values).map(([val, freq]) => (
                                                                    <div key={val} className="flex flex-col mb-1.5">
                                                                        <div className="flex justify-between text-[11px] mb-0.5">
                                                                            <span className="truncate max-w-[120px]">{val}</span>
                                                                            <span>{Math.round(freq * 100)}%</span>
                                                                        </div>
                                                                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                                                                            <div
                                                                                className="h-full bg-primary"
                                                                                style={{ width: `${freq * 100}%` }}
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </TabsContent>

                                <TabsContent value="visuals" className="m-0">
                                    {plots ? (
                                        <div className="grid gap-6 md:grid-cols-2">
                                            {Object.entries(plots).map(([name, base64]) => (
                                                <Card key={name} className="overflow-hidden bg-card border-border">
                                                    <CardContent className="p-0">
                                                        <img
                                                            src={`data:image/png;base64,${base64}`}
                                                            alt={name}
                                                            className="w-full h-auto object-contain"
                                                        />
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex justify-center py-20 text-muted-foreground">
                                            No visualizations available for this dataset.
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="insights" className="m-0">
                                    <Card className="bg-primary/5 border-primary/20">
                                        <CardContent className="p-8">
                                            {loadingInsights ? (
                                                <div className="flex flex-col items-center py-10 gap-3">
                                                    <Lightbulb className="h-8 w-8 text-primary animate-pulse" />
                                                    <p className="text-sm">LLM is reflecting on your data...</p>
                                                </div>
                                            ) : (
                                                <div className="prose prose-invert max-w-none">
                                                    <div className="flex items-center gap-2 mb-6 text-primary">
                                                        <TrendingUp className="h-5 w-5" />
                                                        <h3 className="text-lg font-bold m-0">Strategic Insights</h3>
                                                    </div>
                                                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                                        {insights}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </>
                        )}
                    </ScrollArea>
                </Tabs>

                <DialogFooter className="p-6 border-t bg-muted/20">
                    <div className="flex items-center gap-4 w-full justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Export As</span>
                            <Select value={reportType} onValueChange={setReportType}>
                                <SelectTrigger className="w-[120px] bg-background border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pdf">PDF Report</SelectItem>
                                    <SelectItem value="xlsx">Excel Sheet</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleDownloadReport} disabled={generatingReport} size="lg" className="px-8 gap-2 shadow-lg shadow-primary/25">
                            <Download className="h-4 w-4" />
                            {generatingReport ? 'Generating Report...' : 'Download Analysis'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AnalyticsView;
