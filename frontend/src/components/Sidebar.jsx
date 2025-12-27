import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Trash2, Menu, X, Database, FileText, ChevronLeft, ChevronRight, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export function Sidebar({
    className,
    messageCount,
    onClearChat,
    isOpen, // Mobile open state
    setIsOpen // Mobile open state setter
}) {
    const [isCollapsed, setIsCollapsed] = useState(false)

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed)
    }

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-background text-foreground">
            {/* Header */}
            <div className={cn("flex items-center px-4 h-[44px]", isCollapsed ? "justify-center" : "justify-between")}>
                {!isCollapsed && (
                    <span className="font-bold text-sm tracking-tight">Chat Info</span>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleCollapse}
                    className="hidden md:flex h-6 w-6"
                >
                    {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                </Button>
            </div>

            <Separator />

            {/* Stats */}
            <div className="flex-1 p-2">
                <div className={cn("rounded-md border bg-card text-card-foreground shadow-sm", isCollapsed ? "p-1" : "p-3")}>
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted">
                            <MessageSquare className="h-4 w-4" />
                        </div>
                        {!isCollapsed && (
                            <div>
                                <p className="text-xs font-medium leading-none text-muted-foreground">Messages</p>
                                <p className="text-xl font-bold">{messageCount}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="p-2 mt-auto">
                <Button
                    variant="destructive"
                    className={cn("w-full gap-2 h-8 text-xs", isCollapsed && "px-0")}
                    onClick={onClearChat}
                >
                    <Trash2 className="h-3 w-3" />
                    {!isCollapsed && "Clear Chat"}
                </Button>
            </div>
        </div>
    )

    return (
        <>
            {/* Mobile Sidebar (Sheet) */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent side="left" className="w-[80vw] sm:w-[350px] p-0">
                    <SidebarContent />
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <motion.div
                className={cn(
                    "hidden md:flex flex-col border-r h-full bg-background transition-all duration-300 ease-in-out",
                    className
                )}
                animate={{ width: isCollapsed ? 80 : 280 }}
            >
                <SidebarContent />
            </motion.div>
        </>
    )
}
