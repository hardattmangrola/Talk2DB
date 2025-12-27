import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, LayoutDashboard, Database, Settings, BarChart2, FileText } from 'lucide-react';
import SchemaBuilder from '@/components/SchemaBuilder';
import AnalyticsView from '@/components/AnalyticsView';
import ApiService from '@/services/apiService';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [analyticsFiles, setAnalyticsFiles] = useState([]);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

    useEffect(() => {
        // Double check admin role
        if (user && user.role !== 'admin') {
            navigate('/chat');
        }
        fetchAnalyticsFiles();
    }, [user, navigate]);

    const fetchAnalyticsFiles = async () => {
        if (!user?.token) return;
        setLoadingFiles(true);
        try {
            const data = await ApiService.getAnalyticsFiles(user.token);
            setAnalyticsFiles(data.files || []);
        } catch (error) {
            console.error("Failed to fetch analytics files", error);
        } finally {
            setLoadingFiles(false);
        }
    };

    const handleViewAnalytics = (filename) => {
        setSelectedFile(filename);
        setIsAnalyticsOpen(true);
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/chat')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="text-xl font-bold">Admin Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">Logged in as {user?.username}</span>
                        <Button variant="destructive" size="sm" onClick={logout}>Logout</Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="overview">
                            <LayoutDashboard className="h-4 w-4 mr-2" /> Overview
                        </TabsTrigger>
                        <TabsTrigger value="analytics">
                            <BarChart2 className="h-4 w-4 mr-2" /> Analytics & Reports
                        </TabsTrigger>
                        <TabsTrigger value="schema">
                            <Database className="h-4 w-4 mr-2" /> Schema Management
                        </TabsTrigger>
                        <TabsTrigger value="settings">
                            <Settings className="h-4 w-4 mr-2" /> Settings
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">3</div>
                                    <p className="text-xs text-muted-foreground">Admin, Editor, Viewer</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Analytics Files</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{analyticsFiles.length}</div>
                                    <p className="text-xs text-muted-foreground">Uploaded CSV datasets</p>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="analytics">
                        <Card>
                            <CardHeader>
                                <CardTitle>Data Analytics & Report Generation</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loadingFiles ? (
                                    <div className="py-8 text-center">Loading files...</div>
                                ) : analyticsFiles.length === 0 ? (
                                    <div className="py-8 text-center text-muted-foreground">
                                        No CSV files found. Upload files in the chat interface to see them here.
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {analyticsFiles.map((file) => (
                                            <Card key={file} className="hover:border-primary/50 transition-colors">
                                                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                                                    <div className="p-3 bg-primary/10 rounded-full">
                                                        <FileText className="h-8 w-8 text-primary" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="font-semibold truncate max-w-[200px]">{file}</p>
                                                        <p className="text-xs text-muted-foreground">CSV Dataset</p>
                                                    </div>
                                                    <Button variant="outline" className="w-full gap-2" onClick={() => handleViewAnalytics(file)}>
                                                        <BarChart2 className="h-4 w-4" />
                                                        View Analytics
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="schema">
                        <SchemaBuilder />
                    </TabsContent>

                    <TabsContent value="settings">
                        <Card>
                            <CardContent className="pt-6">
                                <p>System Settings (Coming Soon)</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>

            {selectedFile && (
                <AnalyticsView
                    open={isAnalyticsOpen}
                    onOpenChange={setIsAnalyticsOpen}
                    filename={selectedFile}
                    language="English"
                />
            )}
        </div>
    );
};

export default Dashboard;
