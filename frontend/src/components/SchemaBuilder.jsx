import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from '@/components/ui/scroll-area';

import ApiService from '@/services/apiService';

const SchemaBuilder = () => {
    const { user } = useAuth();
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(false);

    // Create Table State
    const [newTableName, setNewTableName] = useState('');
    const [newColumns, setNewColumns] = useState([{ name: 'id', type: 'INT', primary_key: true, auto_increment: true }]);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        setLoading(true);
        try {
            const data = await ApiService.listTables(user.token);
            setTables(data.tables || []);
        } catch (error) {
            console.error("Failed to fetch tables", error);
        } finally {
            setLoading(false);
        }
    };

    const deleteTable = async (tableName) => {
        if (!confirm(`Are you sure you want to delete table ${tableName}? This cannot be undone.`)) return;

        try {
            await ApiService.deleteTable(tableName, user.token);
            fetchTables();
        } catch (error) {
            alert(error.message || "Failed to delete table");
        }
    };

    const addColumn = () => {
        setNewColumns([...newColumns, { name: '', type: 'VARCHAR(255)', primary_key: false }]);
    };

    const updateColumn = (index, field, value) => {
        const updated = [...newColumns];
        updated[index][field] = value;
        setNewColumns(updated);
    };

    const removeColumn = (index) => {
        if (newColumns.length > 1) {
            const updated = newColumns.filter((_, i) => i !== index);
            setNewColumns(updated);
        }
    };

    const handleCreateTable = async () => {
        if (!newTableName) {
            alert("Table name is required");
            return;
        }

        try {
            await ApiService.createTable(newTableName, newColumns, user.token);
            setIsCreateDialogOpen(false);
            setNewTableName('');
            setNewColumns([{ name: 'id', type: 'INT', primary_key: true, auto_increment: true }]);
            fetchTables();
        } catch (error) {
            alert(`Failed to create table: ${error.message}`);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Database Tables</h2>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Create Table
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Create New Table</DialogTitle>
                            <DialogDescription>Define the schema for your new table.</DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="tablename" className="text-right">Table Name</Label>
                                <Input
                                    id="tablename"
                                    value={newTableName}
                                    onChange={(e) => setNewTableName(e.target.value)}
                                    className="col-span-3"
                                    placeholder="e.g., users"
                                />
                            </div>

                            <div className="border rounded-md p-4">
                                <Label className="mb-2 block">Columns</Label>
                                <ScrollArea className="h-[200px] pr-4">
                                    <div className="space-y-2">
                                        {newColumns.map((col, index) => (
                                            <div key={index} className="flex gap-2 items-center">
                                                <Input
                                                    placeholder="Name"
                                                    value={col.name}
                                                    onChange={(e) => updateColumn(index, 'name', e.target.value)}
                                                    className="w-1/3"
                                                />
                                                <Select value={col.type} onValueChange={(val) => updateColumn(index, 'type', val)}>
                                                    <SelectTrigger className="w-1/3">
                                                        <SelectValue placeholder="Type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="INT">INT</SelectItem>
                                                        <SelectItem value="VARCHAR(255)">VARCHAR</SelectItem>
                                                        <SelectItem value="TEXT">TEXT</SelectItem>
                                                        <SelectItem value="BOOLEAN">BOOLEAN</SelectItem>
                                                        <SelectItem value="DATE">DATE</SelectItem>
                                                        <SelectItem value="DATETIME">DATETIME</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={col.primary_key}
                                                        onChange={(e) => updateColumn(index, 'primary_key', e.target.checked)}
                                                        title="Primary Key"
                                                        className="w-4 h-4"
                                                    />
                                                    <span className="text-xs text-muted-foreground">PK</span>
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => removeColumn(index)} disabled={newColumns.length === 1}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                                <Button variant="secondary" size="sm" onClick={addColumn} className="mt-2 w-full gap-2">
                                    <Plus className="h-3 w-3" /> Add Column
                                </Button>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button onClick={handleCreateTable}>Create Table</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Table Name</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                                </TableRow>
                            ) : tables.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">No tables found.</TableCell>
                                </TableRow>
                            ) : (
                                tables.map((table) => (
                                    <TableRow key={table}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <div className="bg-primary/10 p-2 rounded-md">
                                                <ArrowRight className="h-4 w-4 text-primary" />
                                            </div>
                                            {table}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => deleteTable(table)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                                <Trash2 className="h-4 w-4" /> Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default SchemaBuilder;
