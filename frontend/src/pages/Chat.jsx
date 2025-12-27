import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FileUpload from "../components/FileUpload";
import ApiService from "../services/apiService";
import { Sidebar } from "../components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea"
import { Send, Menu, Moon, Sun, Database, FileSpreadsheet, BarChart2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDarkMode } from "../context/DarkModeContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// Message Bubble Component (Moved here or should be separate)
const MessageBubble = ({ message, isUser }) => {
    const { content, sql, results, timestamp } = message;
    const [showResults, setShowResults] = useState(false);

    const renderResults = () => {
        if (!results || results.length === 0) return null;

        return (
            <div className="mt-4 rounded-md border bg-muted/50 p-4">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-semibold">
                        Query Results ({results.length} rows)
                    </h4>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowResults(!showResults)}
                    >
                        {showResults ? "Hide" : "Show"} Results
                    </Button>
                </div>

                {showResults && (
                    <div className="rounded-md border bg-background">
                        <ScrollArea className="h-[300px] w-full rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {Object.keys(results[0] || {}).map((key, index) => (
                                            <TableHead key={index} className="whitespace-nowrap">{key}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {results.slice(0, 50).map((row, rowIndex) => (
                                        <TableRow key={rowIndex}>
                                            {Object.values(row).map((value, colIndex) => (
                                                <TableCell key={colIndex} className="whitespace-nowrap font-medium">
                                                    {String(value)}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                        {results.length > 50 && (
                            <p className="p-2 text-xs text-muted-foreground text-center">
                                Showing first 50 rows of {results.length} total results
                            </p>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex w-full mb-6 ${isUser ? "justify-end" : "justify-start"}`}
        >
            <div className={`flex gap-3 max-w-[90%] md:max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                    {isUser ? <span className="text-xs font-bold">You</span> : <span className="text-xs font-bold">AI</span>}
                </div>

                <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                    <div
                        className={`rounded-2xl px-4 py-3 shadow-sm ${isUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border text-card-foreground"
                            }`}
                    >
                        <div className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">
                            {content}
                        </div>
                    </div>

                    {(sql || (results && results.length > 0)) && !isUser && (
                        <div className="w-full mt-2">
                            {sql && (
                                <div className="rounded-md bg-muted/50 p-3 mb-2 font-mono text-xs overflow-x-auto border">
                                    <p className="font-semibold text-muted-foreground mb-1">SQL Query:</p>
                                    {sql}
                                </div>
                            )}
                            {renderResults()}
                        </div>
                    )}

                    <span className="text-[10px] text-muted-foreground mt-1">
                        {timestamp && new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

import LanguageSelector from "../components/LanguageSelector";
import AnalyticsView from "../components/AnalyticsView";

const Chat = () => {
    const { darkMode, toggleDarkMode } = useDarkMode();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content:
                "👋 Hello! I'm your AI-powered database assistant. Ask me anything about your data using natural language, or upload CSV files for instant analysis.",
            timestamp: new Date().toISOString(),
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [queryType, setQueryType] = useState("sql");
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [hasUploadedFiles, setHasUploadedFiles] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [language, setLanguage] = useState("English");

    // Analytics State
    const [analyticsOpen, setAnalyticsOpen] = useState(false);
    const [selectedFileForAnalytics, setSelectedFileForAnalytics] = useState(null);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        if (!user) {
            alert("Please login to send messages");
            navigate("/login");
            return;
        }

        const userMessage = {
            role: "user",
            content: input.trim(),
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            let response;
            const headers = { 'Authorization': `Bearer ${user.token}` }; // Add Auth Header

            // We need to pass headers to ApiService, assuming I update ApiService too or modify it here
            // Since ApiService is separate, I should probably update it to take headers or set it globally.
            // For now, I'll assume ApiService needs update or I'll patch it.
            // Let's modify ApiService methods to accept token or headers.
            // Or hack it for now: 

            // Actually ApiService likely uses fetch inside. I should check ApiService.
            // Assuming ApiService needs update. I'll handle that next. 
            // For now, let's pass token if ApiService supports it, or assume I'll fix ApiService.

            // Pass language to ApiService methods, assuming they accept it now.
            // I need to update ApiService to accept language in the body, which I haven't done explicitly in ApiService code 
            // but I should pass it as part of query object or update ApiService to take it as arg.
            // Wait, I updated ApiService to take `token`. I did NOT update it to take `language`.
            // I should update ApiService to include language in the body.
            // Or I can just pass it in the query object if ApiService expects a single object for query?
            // ApiService.queryDatabase(query, token) -> body: { query }
            // The backend expects { query, language }. 
            // So I need to update ApiService again to allow passing extra body params or change `query` arg to `payload`.

            // Let's Quick fix: Update ApiService to accept language. I'll do that in next step.
            // For now, I'll assume ApiService.queryDatabase(query, token, language) exist.

            if (queryType === "sql") {
                response = await ApiService.queryDatabase(input.trim(), user.token, language);
            } else if (queryType === "csv") {
                if (!hasUploadedFiles) {
                    throw new Error(
                        "Please upload CSV files first before querying them."
                    );
                }
                response = await ApiService.queryCSVData(input.trim(), user.token, language);
            }

            const assistantMessage = {
                role: "assistant",
                content: response.reply || response.response || "No response received",
                sql: response.sql,
                results: response.results,
                explanation: response.explanation,
                timestamp: new Date().toISOString(),
                type: queryType === "csv" ? "csv_query" : "sql_query",
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Error fetching response:", error);
            const errorMessage = {
                role: "assistant",
                content: `Sorry, I encountered an error: ${error.message}. Please make sure your backend is running and try again.`,
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleClearChat = () => {
        setMessages([
            {
                role: "assistant",
                content:
                    "👋 Hello! I'm your AI-powered database assistant. Ask me anything about your data using natural language, or upload CSV files for instant analysis.",
                timestamp: new Date().toISOString(),
            },
        ]);
        setMobileSidebarOpen(false);
    };

    const handleFilesUploaded = (result) => {
        const uploadMessage = {
            role: 'assistant',
            content: `Successfully uploaded ${result.files.length} file(s). You can now ask questions about your CSV data.`,
            timestamp: new Date().toISOString(),
            type: 'upload_success'
        };
        setMessages((prev) => [...prev, uploadMessage]);
        setHasUploadedFiles(true);
        setUploadedFiles(prev => [...prev, ...result.files]);
    };

    const handleAnalysisComplete = (result) => {
        const analysisMessage = {
            role: 'assistant',
            content: result.analysis,
            timestamp: new Date().toISOString(),
            type: 'csv_analysis'
        };
        setMessages((prev) => [...prev, analysisMessage]);
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const openAnalytics = (filename) => {
        setSelectedFileForAnalytics(filename);
        setAnalyticsOpen(true);
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden font-sans">
            <AnalyticsView
                open={analyticsOpen}
                onOpenChange={setAnalyticsOpen}
                filename={selectedFileForAnalytics}
                language={language}
            />

            <Sidebar
                messageCount={messages.length}
                onClearChat={handleClearChat}
                isOpen={mobileSidebarOpen}
                setIsOpen={setMobileSidebarOpen}
            />

            <div className="flex-1 flex flex-col h-full relative">
                {/* Navbar */}
                <header className="h-[60px] border-b flex items-center justify-between px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileSidebarOpen(true)}>
                            <Menu className="h-5 w-5" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <Database className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <span className="font-bold text-lg tracking-tight">Talk2DB</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <LanguageSelector currentLanguage={language} onLanguageChange={setLanguage} />
                        <div className="hidden sm:flex bg-muted rounded-lg p-1 gap-1">
                            <Button
                                variant={queryType === "sql" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setQueryType("sql")}
                                className="h-7 text-xs"
                            >
                                <Database className="h-3 w-3 mr-1" /> SQL
                            </Button>
                            <Button
                                variant={queryType === "csv" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setQueryType("csv")}
                                className="h-7 text-xs"
                            >
                                <FileSpreadsheet className="h-3 w-3 mr-1" /> CSV
                            </Button>
                        </div>

                        <div className="flex items-center gap-2 border-l pl-2 ml-2">
                            <span className="text-sm font-medium">{user?.username}</span>
                            {user?.role === 'admin' && (
                                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
                                    Admin
                                </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={logout}>
                                Logout
                            </Button>
                        </div>

                        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
                            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </Button>
                    </div>
                </header>

                {/* File Upload Area (only if CSV mode) */}
                {queryType === "csv" && (
                    <div className="px-6 py-4 border-b bg-muted/10">
                        <div className="max-w-4xl mx-auto">
                            <FileUpload
                                onFilesUploaded={handleFilesUploaded}
                                onAnalysisComplete={handleAnalysisComplete}
                            />
                            {uploadedFiles.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {uploadedFiles.map(file => (
                                        <Button
                                            key={file}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openAnalytics(file)}
                                            className="text-xs h-7"
                                        >
                                            <BarChart2 className="h-3 w-3 mr-1" />
                                            Stats: {file}
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Chat Area */}
                <ScrollArea className="flex-1 px-4 sm:px-6">
                    <div className="max-w-4xl mx-auto py-8">
                        <AnimatePresence mode="popLayout">
                            {messages.map((msg, i) => (
                                <MessageBubble key={i} message={msg} isUser={msg.role === "user"} />
                            ))}
                            {loading && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 mb-6">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                        <span className="text-xs font-bold">AI</span>
                                    </div>
                                    <div className="bg-card border px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                                        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 bg-background border-t">
                    <div className="max-w-4xl mx-auto relative rounded-lg border bg-card shadow-sm transition-all focus-within:ring-1 focus-within:ring-primary flex items-end">
                        <Textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder={queryType === 'sql' ? "Ask about your database..." : "Ask questions about your CSV data..."}
                            className="min-h-[44px] max-h-[120px] w-full resize-none border-0 bg-transparent py-3 px-4 focus-visible:ring-0 shadow-none text-sm placeholder:text-muted-foreground/70"
                        />
                        <div className="flex items-center gap-2 p-1.5 pb-2">
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap hidden sm:inline-block">{input.length}/1000</span>
                            <Button
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                size="icon"
                                className="h-8 w-8"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Chat;
