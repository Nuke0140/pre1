'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  Package,
  Layers,
  ArrowRight,
  Plus,
  RefreshCw,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  DollarSign,
  Truck,
  ShoppingCart,
  Check,
  X,
  FileText,
  Boxes,
  TrendingDown,
  AlertCircle,
  Archive,
  BarChart3,
  Calendar,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Tag,
  Warehouse,
  RotateCcw,
  ArrowLeftRight,
  Eye,
  MapPin,
  SlidersHorizontal,
  User,
  GraduationCap,
  Users,
  Utensils,
  HeartPulse,
} from 'lucide-react'
import { PageHead, StatusBadge, EmptyState, KpiTile, Skeleton, Field } from '@/components/preone/ui'
import { Modal, Drawer } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { inr, fmtDate, enumLabel } from '@/lib/format'
import { Role } from '@/lib/auth'
import { normalizeRole } from '@/lib/roles'

interface SessionProps {
  uid: string
  email: string
  name: string
  role: Role
  tenantId: string | null
  branchId: string | null
}

export function InventoryClient({ session }: { session: SessionProps }) {
  const toast = useToast()
  const role = session.role
  const isTeacher = normalizeRole(role) === 'TEACHER'
  const isStaff = ['TEACHER', 'STAFF', 'ACCOUNTS', 'DRIVER'].includes(normalizeRole(role))
  const canApprove = ['OWNER', 'PRINCIPAL', 'PLATFORM_ADMIN'].includes(normalizeRole(role))
  const canProcure = ['OWNER', 'PRINCIPAL', 'ACCOUNTS', 'PLATFORM_ADMIN'].includes(normalizeRole(role))
  const canManageStock = ['OWNER', 'PRINCIPAL', 'ACCOUNTS', 'PLATFORM_ADMIN'].includes(normalizeRole(role))

  // 8 Canonical Workspaces
  type TabKey = 'OVERVIEW' | 'ITEMS' | 'DISTRIBUTION' | 'STORES' | 'PROCUREMENT' | 'RECEIVING' | 'VENDORS' | 'REPORTS'
  const [activeTab, setActiveTab] = useState<TabKey>(isTeacher ? 'DISTRIBUTION' : 'OVERVIEW')

  // Sub-segments for Workspace 3 (Requests & Distribution)
  type DistSubTab = 'ALL_DISTRIBUTIONS' | 'CLASSROOM_DIST' | 'STUDENT_DIST' | 'STAFF_DEPT_DIST' | 'REQUISITIONS'
  const [distSubTab, setDistSubTab] = useState<DistSubTab>('ALL_DISTRIBUTIONS')

  // Sub-segments for Workspace 8 (Reports & Audit)
  type ReportSubTab = 'LEDGER' | 'STUDENT_REPORT' | 'CLASSROOM_REPORT' | 'STAFF_REPORT' | 'LOW_STOCK' | 'EXPIRY' | 'FINANCE'
  const [reportSubTab, setReportSubTab] = useState<ReportSubTab>('LEDGER')

  // Data states
  const [metrics, setMetrics] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [stocks, setStocks] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [grns, setGrns] = useState<any[]>([])
  const [distributions, setDistributions] = useState<any[]>([])
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [reconciliation, setReconciliation] = useState<any>(null)
  const [movements, setMovements] = useState<any[]>([])
  const [lowStockList, setLowStockList] = useState<any[]>([])
  const [expiringList, setExpiringList] = useState<any[]>([])

  // Search & Filter
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [studentSearch, setStudentSearch] = useState('')
  const [storeSearch, setStoreSearch] = useState('')
  const [poSearch, setPoSearch] = useState('')
  const [grnSearch, setGrnSearch] = useState('')
  const [vendorSearch, setVendorSearch] = useState('')
  const [distSearch, setDistSearch] = useState('')
  const [busy, setBusy] = useState(false)

  // Modals
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [poModalOpen, setPoModalOpen] = useState(false)
  const [grnModalOpen, setGrnModalOpen] = useState(false)
  const [classroomDistModalOpen, setClassroomDistModalOpen] = useState(false)
  const [studentDistModalOpen, setStudentDistModalOpen] = useState(false)
  const [deptDistModalOpen, setDeptDistModalOpen] = useState(false)
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [vendorModalOpen, setVendorModalOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [unitModalOpen, setUnitModalOpen] = useState(false)

  // Selection states for distribution workflows
  const [selectedClassroomId, setSelectedClassroomId] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedDistLocationId, setSelectedDistLocationId] = useState('')

  // Side Peek Drawer
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerType, setDrawerType] = useState<'REQUEST' | 'PO' | 'GRN' | 'ITEM' | 'STOCK' | 'DISTRIBUTION'>('DISTRIBUTION')
  const [drawerData, setDrawerData] = useState<any>(null)

  const [selectedPO, setSelectedPO] = useState<any>(null)

  // Multi-line items states
  const [requestLines, setRequestLines] = useState<Array<{ itemId: string; quantityRequested: number; notes: string }>>([
    { itemId: '', quantityRequested: 1, notes: '' },
  ])
  const [poLines, setPoLines] = useState<Array<{ itemId: string; quantityOrdered: number; unitPriceCents: number; taxRatePercent: number }>>([
    { itemId: '', quantityOrdered: 10, unitPriceCents: 1000, taxRatePercent: 0 },
  ])
  const [grnLines, setGrnLines] = useState<Array<{ purchaseOrderItemId?: string; itemId: string; quantityReceived: number; unitPriceCents: number; batchNumber: string }>>([])
  const [distLines, setDistLines] = useState<Array<{ itemId: string; quantity: number }>>([
    { itemId: '', quantity: 1 },
  ])

  // Fetch functions
  const loadDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/inventory/dashboard').then((r) => r.json())
      if (res.success) setMetrics(res.data)
    } catch {}
  }, [])

  const loadItems = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/inventory/items?pageSize=100').then((r) => r.json())
      if (res.success) setItems(res.data.items || [])
    } catch {}
  }, [])

  const loadRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/inventory/material-requests?pageSize=100').then((r) => r.json())
      if (res.success) setRequests(res.data.requests || [])
    } catch {}
  }, [])

  const loadDistributions = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/inventory/issues?pageSize=100').then((r) => r.json())
      if (res.success) setDistributions(res.data.issues || [])
    } catch {}
  }, [])

  const loadProcurement = useCallback(async () => {
    try {
      const [poRes, grnRes, recRes] = await Promise.all([
        fetch('/api/v1/inventory/purchase-orders?pageSize=100').then((r) => r.json()),
        fetch('/api/v1/inventory/grn?pageSize=100').then((r) => r.json()),
        fetch('/api/v1/inventory/reports?type=reconciliation').then((r) => r.json()),
      ])
      if (poRes.success) setOrders(poRes.data.orders || [])
      if (grnRes.success) setGrns(grnRes.data.receipts || [])
      if (recRes.success) setReconciliation(recRes.data)
    } catch {}
  }, [])

  const loadStores = useCallback(async () => {
    try {
      const [stkRes, locRes] = await Promise.all([
        fetch('/api/v1/inventory/stock').then((r) => r.json()),
        fetch('/api/v1/inventory/locations').then((r) => r.json()),
      ])
      if (stkRes.success) setStocks(stkRes.data || [])
      if (locRes.success) {
        setLocations(locRes.data || [])
        if (locRes.data?.length > 0 && !selectedDistLocationId) {
          setSelectedDistLocationId(locRes.data[0].id)
        }
      }
    } catch {}
  }, [selectedDistLocationId])

  const loadMasters = useCallback(async () => {
    try {
      const [vRes, catRes, uRes, clsRes, stuRes] = await Promise.all([
        fetch('/api/v1/inventory/vendors').then((r) => r.json()),
        fetch('/api/v1/inventory/categories').then((r) => r.json()),
        fetch('/api/v1/inventory/units').then((r) => r.json()),
        fetch('/api/v1/classrooms').then((r) => r.json()),
        fetch('/api/v1/students?status=ACTIVE&pageSize=100').then((r) => r.json()),
      ])
      if (vRes.success) setVendors(vRes.data || [])
      if (catRes.success) setCategories(catRes.data || [])
      if (uRes.success) setUnits(uRes.data || [])
      if (clsRes.success) setClassrooms(clsRes.data || [])
      if (stuRes.success) setStudents(Array.isArray(stuRes.data) ? stuRes.data : stuRes.data?.students || [])
    } catch {}
  }, [])

  const loadReportsAndAudit = useCallback(async () => {
    try {
      const [mvRes, lowRes, expRes, consRes, recRes] = await Promise.all([
        fetch('/api/v1/inventory/movements?limit=100').then((r) => r.json()),
        fetch('/api/v1/inventory/reports?type=low-stock').then((r) => r.json()),
        fetch('/api/v1/inventory/reports?type=expiring&days=90').then((r) => r.json()),
        fetch('/api/v1/inventory/reports?type=consumption').then((r) => r.json()),
        fetch('/api/v1/inventory/reports?type=reconciliation').then((r) => r.json()),
      ])
      if (mvRes.success) setMovements(mvRes.data || [])
      if (lowRes.success) setLowStockList(lowRes.data?.items || lowRes.data || [])
      if (expRes.success) setExpiringList(expRes.data || [])
      if (consRes.success) setAnalytics(consRes.data)
      if (recRes.success) setReconciliation(recRes.data)
    } catch {}
  }, [])

  const reloadAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([
      loadDashboard(),
      loadItems(),
      loadRequests(),
      loadDistributions(),
      loadStores(),
      loadMasters(),
      loadProcurement(),
      loadReportsAndAudit(),
    ])
    setLoading(false)
  }, [loadDashboard, loadItems, loadRequests, loadDistributions, loadStores, loadMasters, loadProcurement, loadReportsAndAudit])

  useEffect(() => {
    reloadAll()
  }, [reloadAll])

  // Drawer Opener
  const openDrawer = (type: 'REQUEST' | 'PO' | 'GRN' | 'ITEM' | 'STOCK' | 'DISTRIBUTION', data: any) => {
    setDrawerType(type)
    setDrawerData(data)
    setDrawerOpen(true)
  }

  // Helper: Get available quantity for an item at selected store location
  const getAvailableStockAtLocation = (itemId: string, locationId: string) => {
    if (!itemId || !locationId) return 0
    const matched = stocks.find((s) => s.itemId === itemId && s.locationId === locationId)
    return matched ? Number(matched.availableQuantity ?? matched.quantity ?? 0) : 0
  }

  // Handlers
  const handleCreateRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const validItems = requestLines.filter((l) => l.itemId && l.quantityRequested > 0)
      if (validItems.length === 0) {
        toast.error('Validation Error', 'Please add at least one valid item with quantity > 0')
        setBusy(false)
        return
      }

      const payload = {
        classroomId: fd.get('classroomId') || undefined,
        priority: fd.get('priority') || 'MEDIUM',
        requiredByDate: fd.get('requiredByDate') ? new Date(String(fd.get('requiredByDate'))) : undefined,
        reason: fd.get('reason') || 'Preschool classroom supplies',
        items: validItems,
      }

      const res = await fetch('/api/v1/inventory/material-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      setBusy(false)
      if (json.success) {
        toast.success('Material Request Submitted', `Request ${json.data.requestNumber} created successfully`)
        setRequestModalOpen(false)
        setRequestLines([{ itemId: '', quantityRequested: 1, notes: '' }])
        loadRequests()
        loadDashboard()
      } else {
        toast.error('Submission Failed', json.error?.message || 'Could not submit material request')
      }
    } catch (err: any) {
      setBusy(false)
      toast.error('Error', err.message)
    }
  }

  const handleApproveRequest = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/inventory/material-requests/${id}/approve`, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        toast.success('Approved', 'Material request approved')
        loadRequests()
        loadDashboard()
        if (drawerOpen && drawerData?.id === id) {
          setDrawerData({ ...drawerData, status: 'APPROVED' })
        }
      } else {
        toast.error('Approval Failed', json.error?.message)
      }
    } catch (err: any) {
      toast.error('Error', err.message)
    }
  }

  const handleRejectRequest = async (id: string) => {
    const reason = window.prompt('Enter reason for rejection:') || 'Not approved'
    try {
      const res = await fetch(`/api/v1/inventory/material-requests/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Rejected', 'Material request rejected')
        loadRequests()
        loadDashboard()
        if (drawerOpen && drawerData?.id === id) {
          setDrawerData({ ...drawerData, status: 'REJECTED' })
        }
      } else {
        toast.error('Rejection Failed', json.error?.message)
      }
    } catch (err: any) {
      toast.error('Error', err.message)
    }
  }

  // Handlers for Distribution Workflows
  const handleClassroomDistributionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const fromLocationId = String(fd.get('fromLocationId'))
      const classroomId = String(fd.get('classroomId'))
      const selectedClassroom = classrooms.find((c) => c.id === classroomId)
      const recipientName = String(fd.get('recipientName') || selectedClassroom?.teacher || 'Classroom Teacher')
      const purpose = String(fd.get('purpose') || 'Bulk classroom material distribution')
      const notes = String(fd.get('notes') || '')

      const validItems = distLines.filter((l) => l.itemId && l.quantity > 0)
      if (validItems.length === 0) {
        toast.error('Validation Error', 'Enter at least one item with valid quantity')
        setBusy(false)
        return
      }

      // Check stock availability
      for (const line of validItems) {
        const available = getAvailableStockAtLocation(line.itemId, fromLocationId)
        if (line.quantity > available) {
          const itemObj = items.find((i) => i.id === line.itemId)
          toast.error('Insufficient Stock', `Only ${available} available for '${itemObj?.name || 'item'}'. Requested: ${line.quantity}`)
          setBusy(false)
          return
        }
      }

      const payload = {
        fromLocationId,
        destinationType: 'CLASSROOM',
        classroomId,
        recipientName,
        purpose,
        notes: notes || undefined,
        items: validItems.map((l) => ({ itemId: l.itemId, quantity: Number(l.quantity) })),
      }

      const res = await fetch('/api/v1/inventory/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      setBusy(false)
      if (json.success) {
        toast.success('Classroom Supplies Issued', `Distribution ${json.data.issueNumber} recorded for ${selectedClassroom?.name || 'classroom'}.`)
        setClassroomDistModalOpen(false)
        setDistLines([{ itemId: '', quantity: 1 }])
        loadStores()
        loadDistributions()
        loadDashboard()
        loadReportsAndAudit()
      } else {
        toast.error('Distribution Failed', json.error?.message)
      }
    } catch (err: any) {
      setBusy(false)
      toast.error('Error', err.message)
    }
  }

  const handleStudentDistributionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const fromLocationId = String(fd.get('fromLocationId'))
      const studentId = String(fd.get('studentId'))
      const selectedStudent = students.find((s) => s.id === studentId)
      const recipientName = selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName || ''}`.trim() : 'Enrolled Student'
      const classroomId = selectedStudent?.currentClassroomId || selectedStudent?.classroomId || undefined
      const purpose = String(fd.get('purpose') || 'Student uniform / kit distribution')
      const notes = String(fd.get('notes') || '')

      const validItems = distLines.filter((l) => l.itemId && l.quantity > 0)
      if (validItems.length === 0) {
        toast.error('Validation Error', 'Enter at least one item with valid quantity')
        setBusy(false)
        return
      }

      // Check stock availability
      for (const line of validItems) {
        const available = getAvailableStockAtLocation(line.itemId, fromLocationId)
        if (line.quantity > available) {
          const itemObj = items.find((i) => i.id === line.itemId)
          toast.error('Insufficient Stock', `Only ${available} available for '${itemObj?.name || 'item'}'. Requested: ${line.quantity}`)
          setBusy(false)
          return
        }
      }

      const payload = {
        fromLocationId,
        destinationType: 'STUDENT',
        studentId,
        classroomId,
        recipientName,
        purpose,
        notes: notes || undefined,
        items: validItems.map((l) => ({ itemId: l.itemId, quantity: Number(l.quantity) })),
      }

      const res = await fetch('/api/v1/inventory/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      setBusy(false)
      if (json.success) {
        toast.success('Student Supplies Issued', `Distribution ${json.data.issueNumber} recorded for ${recipientName}.`)
        setStudentDistModalOpen(false)
        setDistLines([{ itemId: '', quantity: 1 }])
        loadStores()
        loadDistributions()
        loadDashboard()
        loadReportsAndAudit()
      } else {
        toast.error('Distribution Failed', json.error?.message)
      }
    } catch (err: any) {
      setBusy(false)
      toast.error('Error', err.message)
    }
  }

  const handleDeptDistributionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const fromLocationId = String(fd.get('fromLocationId'))
      const destinationType = String(fd.get('destinationType') || 'OPERATIONS')
      const recipientName = String(fd.get('recipientName') || 'Department Staff')
      const purpose = String(fd.get('purpose') || 'Operational department supply issue')
      const notes = String(fd.get('notes') || '')

      const validItems = distLines.filter((l) => l.itemId && l.quantity > 0)
      if (validItems.length === 0) {
        toast.error('Validation Error', 'Enter at least one item')
        setBusy(false)
        return
      }

      const payload = {
        fromLocationId,
        destinationType,
        recipientName,
        purpose,
        notes: notes || undefined,
        items: validItems.map((l) => ({ itemId: l.itemId, quantity: Number(l.quantity) })),
      }

      const res = await fetch('/api/v1/inventory/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      setBusy(false)
      if (json.success) {
        toast.success('Department Supplies Issued', `Issue ${json.data.issueNumber} recorded.`)
        setDeptDistModalOpen(false)
        setDistLines([{ itemId: '', quantity: 1 }])
        loadStores()
        loadDistributions()
        loadDashboard()
        loadReportsAndAudit()
      } else {
        toast.error('Issue Failed', json.error?.message)
      }
    } catch (err: any) {
      setBusy(false)
      toast.error('Error', err.message)
    }
  }

  const handleCreatePO = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const validItems = poLines.filter((l) => l.itemId && l.quantityOrdered > 0)
      if (validItems.length === 0) {
        toast.error('Validation Error', 'Add at least one item')
        setBusy(false)
        return
      }

      const payload = {
        vendorId: fd.get('vendorId'),
        destinationLocationId: fd.get('destinationLocationId'),
        expectedDeliveryDate: fd.get('expectedDeliveryDate') ? new Date(String(fd.get('expectedDeliveryDate'))) : undefined,
        paymentTerms: fd.get('paymentTerms') || 'NET_30',
        shippingAddress: fd.get('shippingAddress') || undefined,
        notes: fd.get('notes') || undefined,
        items: validItems,
      }

      const res = await fetch('/api/v1/inventory/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      setBusy(false)
      if (json.success) {
        toast.success('Purchase Order Created', `PO ${json.data.poNumber} created`)
        setPoModalOpen(false)
        loadProcurement()
        loadDashboard()
      } else {
        toast.error('PO Creation Failed', json.error?.message)
      }
    } catch (err: any) {
      setBusy(false)
      toast.error('Error', err.message)
    }
  }

  const handleApprovePO = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/inventory/purchase-orders/${id}/approve`, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        toast.success('PO Approved', 'Purchase order status updated to ORDERED')
        loadProcurement()
        loadDashboard()
        if (drawerOpen && drawerData?.id === id) {
          setDrawerData({ ...drawerData, status: 'ORDERED' })
        }
      } else {
        toast.error('Approval Failed', json.error?.message)
      }
    } catch (err: any) {
      toast.error('Error', err.message)
    }
  }

  const openGRNModal = (po: any) => {
    setSelectedPO(po)
    const lines = po.items.map((pi: any) => {
      const remaining = pi.quantityOrdered - pi.quantityReceived
      return {
        purchaseOrderItemId: pi.id,
        itemId: pi.itemId,
        itemCode: pi.item?.code || '',
        itemName: pi.item?.name || '',
        unitSymbol: pi.item?.unit?.symbol || '',
        ordered: pi.quantityOrdered,
        alreadyReceived: pi.quantityReceived,
        quantityReceived: remaining > 0 ? remaining : 0,
        unitPriceCents: pi.unitPriceCents,
        batchNumber: `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
      }
    })
    setGrnLines(lines)
    setGrnModalOpen(true)
  }

  const handleCreateGRN = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const validItems = grnLines.filter((l) => l.quantityReceived > 0)
      if (validItems.length === 0) {
        toast.error('Validation Error', 'Enter at least one item quantity > 0')
        setBusy(false)
        return
      }

      const payload = {
        purchaseOrderId: selectedPO.id,
        locationId: fd.get('locationId') || selectedPO.destinationLocationId,
        vendorInvoiceNumber: fd.get('vendorInvoiceNumber') || undefined,
        challanNumber: fd.get('challanNumber') || undefined,
        notes: fd.get('notes') || 'Goods receipt verification',
        items: validItems.map((l: any) => ({
          purchaseOrderItemId: l.purchaseOrderItemId,
          itemId: l.itemId,
          quantityReceived: Number(l.quantityReceived),
          unitPriceCents: Number(l.unitPriceCents),
          batchNumber: l.batchNumber || undefined,
        })),
      }

      const res = await fetch('/api/v1/inventory/grn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      setBusy(false)
      if (json.success) {
        toast.success('Goods Received (GRN)', `GRN ${json.data.grnNumber} finalized. Stock incremented and vendor bill posted.`)
        setGrnModalOpen(false)
        loadProcurement()
        loadStores()
        loadDashboard()
        loadReportsAndAudit()
      } else {
        toast.error('GRN Failed', json.error?.message)
      }
    } catch (err: any) {
      setBusy(false)
      toast.error('Error', err.message)
    }
  }

  const handleReturnStock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const itemId = String(fd.get('itemId'))
      const quantity = Number(fd.get('quantity'))
      const condition = String(fd.get('condition')) as 'GOOD' | 'DAMAGED' | 'EXPIRED'
      const destinationLocationId = String(fd.get('destinationLocationId'))
      const reason = String(fd.get('reason') || 'Returned unused classroom materials')

      if (!itemId || quantity <= 0 || !destinationLocationId) {
        toast.error('Validation Error', 'Select item, store location, and valid quantity')
        setBusy(false)
        return
      }

      const payload = {
        destinationLocationId,
        notes: reason,
        items: [
          {
            itemId,
            quantity,
            condition,
            reason,
          },
        ],
      }

      const res = await fetch('/api/v1/inventory/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      setBusy(false)
      if (json.success) {
        toast.success('Stock Returned', `Return ${json.data.returnNumber} processed (${condition} condition).`)
        setReturnModalOpen(false)
        loadStores()
        loadDashboard()
        loadReportsAndAudit()
      } else {
        toast.error('Return Failed', json.error?.message)
      }
    } catch (err: any) {
      setBusy(false)
      toast.error('Error', err.message)
    }
  }

  const handleAdjustStock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const locationId = String(fd.get('locationId'))
      const itemId = String(fd.get('itemId'))
      const physicalQuantity = Number(fd.get('physicalQuantity'))
      const reasonCategory = String(fd.get('reasonCategory') || 'COUNT_DISCREPANCY')
      const notes = String(fd.get('notes') || 'Physical stock audit reconciliation')

      if (!locationId || !itemId || isNaN(physicalQuantity) || physicalQuantity < 0) {
        toast.error('Validation Error', 'Provide location, item and verified physical count')
        setBusy(false)
        return
      }

      const payload = {
        locationId,
        reason: `${reasonCategory}: ${notes}`,
        items: [
          {
            itemId,
            physicalQuantity,
            reason: `${reasonCategory}: ${notes}`,
          },
        ],
      }

      const res = await fetch('/api/v1/inventory/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      setBusy(false)
      if (json.success) {
        toast.success('Stock Audit Reconciled', `Adjustment ${json.data.adjustmentNumber} applied. Store balance updated.`)
        setAdjustModalOpen(false)
        loadStores()
        loadDashboard()
        loadReportsAndAudit()
      } else {
        toast.error('Adjustment Failed', json.error?.message)
      }
    } catch (err: any) {
      setBusy(false)
      toast.error('Error', err.message)
    }
  }

  const handleTransferStock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const fromLocationId = String(fd.get('fromLocationId'))
      const toLocationId = String(fd.get('toLocationId'))
      const itemId = String(fd.get('itemId'))
      const quantity = Number(fd.get('quantity'))
      const reason = String(fd.get('reason') || 'Inter-store transfer')

      if (fromLocationId === toLocationId) {
        toast.error('Validation Error', 'Source and destination store must be different')
        setBusy(false)
        return
      }
      if (!itemId || quantity <= 0) {
        toast.error('Validation Error', 'Please select item and positive quantity')
        setBusy(false)
        return
      }

      const payload = {
        fromLocationId,
        toLocationId,
        itemId,
        quantity,
        reason,
      }

      const res = await fetch('/api/v1/inventory/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      setBusy(false)
      if (json.success) {
        toast.success('Stock Transferred', `${quantity} units transferred atomically between stores.`)
        setTransferModalOpen(false)
        loadStores()
        loadDashboard()
        loadReportsAndAudit()
      } else {
        toast.error('Transfer Failed', json.error?.message)
      }
    } catch (err: any) {
      setBusy(false)
      toast.error('Error', err.message)
    }
  }

  const handleCreateLocation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const payload = {
        name: String(fd.get('name')).trim(),
        code: String(fd.get('code')).trim().toUpperCase(),
        locationType: String(fd.get('locationType') || 'MAIN_STORE'),
      }

      const res = await fetch('/api/v1/inventory/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      setBusy(false)
      if (json.success) {
        toast.success('Location Added', `Store '${json.data.name}' ready for inventory.`)
        setLocationModalOpen(false)
        loadStores()
      } else {
        toast.error('Creation Failed', json.error?.message)
      }
    } catch (err: any) {
      setBusy(false)
      toast.error('Error', err.message)
    }
  }

  const handleCreateVendor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const payload = {
        name: String(fd.get('name')).trim(),
        code: fd.get('code') ? String(fd.get('code')).trim().toUpperCase() : undefined,
        contactPerson: fd.get('contactPerson') ? String(fd.get('contactPerson')).trim() : undefined,
        email: fd.get('email') ? String(fd.get('email')).trim() : undefined,
        phone: fd.get('phone') ? String(fd.get('phone')).trim() : undefined,
        address: fd.get('address') ? String(fd.get('address')).trim() : undefined,
        gstin: fd.get('gstin') ? String(fd.get('gstin')).trim().toUpperCase() : undefined,
        pan: fd.get('pan') ? String(fd.get('pan')).trim().toUpperCase() : undefined,
        paymentTerms: String(fd.get('paymentTerms') || 'NET_30'),
      }

      const res = await fetch('/api/v1/inventory/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      setBusy(false)
      if (json.success) {
        toast.success('Vendor Registered', `Vendor '${json.data.name}' added to directory.`)
        setVendorModalOpen(false)
        loadMasters()
      } else {
        toast.error('Vendor Registration Failed', json.error?.message)
      }
    } catch (err: any) {
      setBusy(false)
      toast.error('Error', err.message)
    }
  }

  const handleCreateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const payload = {
        name: String(fd.get('name')).trim(),
        code: String(fd.get('code')).trim().toUpperCase(),
        description: fd.get('description') ? String(fd.get('description')).trim() : undefined,
      }

      const res = await fetch('/api/v1/inventory/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      setBusy(false)
      if (json.success) {
        toast.success('Category Added', `Category '${json.data.name}' created.`)
        setCategoryModalOpen(false)
        loadMasters()
      } else {
        toast.error('Category Creation Failed', json.error?.message)
      }
    } catch (err: any) {
      setBusy(false)
      toast.error('Error', err.message)
    }
  }

  const handleCreateUnit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const payload = {
        name: String(fd.get('name')).trim(),
        symbol: String(fd.get('symbol')).trim().toLowerCase(),
        unitType: String(fd.get('unitType') || 'COUNT'),
      }

      const res = await fetch('/api/v1/inventory/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      setBusy(false)
      if (json.success) {
        toast.success('Unit Added', `Measurement unit '${json.data.name} (${json.data.symbol})' created.`)
        setUnitModalOpen(false)
        loadMasters()
      } else {
        toast.error('Unit Creation Failed', json.error?.message)
      }
    } catch (err: any) {
      setBusy(false)
      toast.error('Error', err.message)
    }
  }

  const exportCsv = (type: 'stock' | 'movements' | 'procurement' | 'consumption') => {
    window.open(`/api/v1/inventory/export?type=${type}`, '_blank')
  }

  // Filtered Items
  const filteredItems = items.filter((it) => {
    const matchesSearch = !searchQuery || it.name.toLowerCase().includes(searchQuery.toLowerCase()) || it.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'ALL' || it.categoryId === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Filtered Distributions
  const filteredDistributions = distributions.filter((d) => {
    let matchesTab = true
    if (distSubTab === 'CLASSROOM_DIST') matchesTab = d.destinationType === 'CLASSROOM'
    else if (distSubTab === 'STUDENT_DIST') matchesTab = d.destinationType === 'STUDENT'
    else if (distSubTab === 'STAFF_DEPT_DIST') matchesTab = ['STAFF', 'KITCHEN', 'CLEANING', 'FIRST_AID', 'OPERATIONS'].includes(d.destinationType)
    if (!matchesTab) return false

    if (!distSearch) return true
    const q = distSearch.toLowerCase()
    return (
      d.issueNumber?.toLowerCase().includes(q) ||
      d.recipientName?.toLowerCase().includes(q) ||
      d.student?.firstName?.toLowerCase().includes(q) ||
      d.student?.lastName?.toLowerCase().includes(q) ||
      d.student?.admissionNo?.toLowerCase().includes(q) ||
      d.classroom?.name?.toLowerCase().includes(q)
    )
  })

  // Filtered Stocks across physical stores
  const filteredStocks = stocks.filter((stk) => {
    if (!storeSearch) return true
    const q = storeSearch.toLowerCase()
    return (
      stk.item?.name?.toLowerCase().includes(q) ||
      stk.item?.code?.toLowerCase().includes(q) ||
      stk.location?.name?.toLowerCase().includes(q) ||
      stk.batchNumber?.toLowerCase().includes(q)
    )
  })

  // Filtered Purchase Orders
  const filteredOrders = orders.filter((po) => {
    if (!poSearch) return true
    const q = poSearch.toLowerCase()
    return (
      po.poNumber?.toLowerCase().includes(q) ||
      po.vendor?.name?.toLowerCase().includes(q) ||
      po.status?.toLowerCase().includes(q)
    )
  })

  // Filtered Goods Receipt Notes
  const filteredGrns = grns.filter((grn) => {
    if (!grnSearch) return true
    const q = grnSearch.toLowerCase()
    return (
      grn.grnNumber?.toLowerCase().includes(q) ||
      grn.purchaseOrder?.poNumber?.toLowerCase().includes(q) ||
      grn.vendor?.name?.toLowerCase().includes(q)
    )
  })

  // Filtered Approved Vendors
  const filteredVendors = vendors.filter((v) => {
    if (!vendorSearch) return true
    const q = vendorSearch.toLowerCase()
    return (
      v.name?.toLowerCase().includes(q) ||
      v.code?.toLowerCase().includes(q) ||
      v.contactPerson?.toLowerCase().includes(q) ||
      v.gstin?.toLowerCase().includes(q) ||
      v.pan?.toLowerCase().includes(q)
    )
  })

  return (
    <>
      <PageHead
        title="Inventory & Procurement"
        badge={
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 8px',
              fontSize: '0.72rem',
              fontWeight: 600,
              borderRadius: '9999px',
              background: 'var(--preone-primary-soft, #f3eeff)',
              color: 'var(--preone-primary, #7c3aed)',
              border: '1px solid rgba(124, 58, 237, 0.2)',
              marginLeft: 8,
              letterSpacing: '0.04em',
            }}
          >
            M08
          </span>
        }
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {activeTab === 'OVERVIEW' && (
              !isTeacher && canProcure ? (
                <button className="btn btn-primary" onClick={() => setPoModalOpen(true)}>
                  <Plus size={15} /> New Purchase Order
                </button>
              ) : isTeacher ? (
                <button className="btn btn-primary" onClick={() => setRequestModalOpen(true)}>
                  <Sparkles size={15} /> Request Materials
                </button>
              ) : null
            )}
            {activeTab === 'ITEMS' && canManageStock && (
              <button className="btn btn-primary" onClick={() => setItemModalOpen(true)}>
                <Plus size={15} /> Add Inventory Item
              </button>
            )}
            {activeTab === 'DISTRIBUTION' && canManageStock && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={() => setClassroomDistModalOpen(true)}>
                  <GraduationCap size={15} /> Classroom Issue
                </button>
                <button className="btn btn-outline" onClick={() => setStudentDistModalOpen(true)}>
                  <User size={15} /> Student Issue
                </button>
              </div>
            )}
            {activeTab === 'STORES' && canManageStock && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline" onClick={() => setAdjustModalOpen(true)}>
                  <Boxes size={15} /> Physical Count Audit
                </button>
                <button className="btn btn-primary" onClick={() => setTransferModalOpen(true)}>
                  <ArrowLeftRight size={15} /> Transfer Stock
                </button>
              </div>
            )}
            {activeTab === 'PROCUREMENT' && canProcure && (
              <button className="btn btn-primary" onClick={() => setPoModalOpen(true)}>
                <Plus size={15} /> New Purchase Order
              </button>
            )}
            {activeTab === 'VENDORS' && canProcure && (
              <button className="btn btn-primary" onClick={() => setVendorModalOpen(true)}>
                <Plus size={15} /> Register Vendor
              </button>
            )}
            {activeTab === 'REPORTS' && (
              <button className="btn btn-primary" onClick={() => exportCsv('movements')}>
                <Download size={15} /> Export Ledger CSV
              </button>
            )}
            <button className="btn btn-outline" onClick={reloadAll} disabled={loading} title="Reload live data">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        }
      />

      {/* 8 CANONICAL WORKSPACE HORIZONTAL METRO NAVIGATION */}
      <nav
        aria-label="Inventory Workspaces"
        style={{
          display: 'flex',
          gap: 6,
          padding: 6,
          background: 'var(--surface-card, #ffffff)',
          border: '1px solid var(--border-default, #e2e8f0)',
          borderRadius: 'var(--radius-lg, 16px)',
          boxShadow: 'var(--elevation-1)',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          marginBottom: 20,
        }}
      >
        {[
          { key: 'OVERVIEW', label: '1. Overview', icon: BarChart3, hide: isTeacher },
          { key: 'ITEMS', label: '2. Items & Stock', icon: Package },
          { key: 'DISTRIBUTION', label: '3. Requests & Distribution', icon: Sparkles, badge: requests.filter((r) => r.status === 'PENDING').length || undefined },
          { key: 'STORES', label: '4. Stores & Transfers', icon: Warehouse, hide: isTeacher },
          { key: 'PROCUREMENT', label: '5. Procurement', icon: ShoppingCart, hide: isTeacher },
          { key: 'RECEIVING', label: '6. Receiving (GRN)', icon: Truck, hide: isTeacher },
          { key: 'VENDORS', label: '7. Vendors', icon: Building2, hide: isTeacher },
          { key: 'REPORTS', label: '8. Reports & Audit', icon: Boxes, hide: isTeacher },
        ]
          .filter((t) => !t.hide)
          .map((tab) => {
            const isActive = activeTab === tab.key
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as TabKey)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 16px',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 500,
                  borderRadius: 'var(--radius-md, 12px)',
                  border: isActive
                    ? '1px solid color-mix(in srgb, var(--primary, #7c3aed) 28%, transparent)'
                    : '1px solid transparent',
                  background: isActive
                    ? 'var(--preone-primary-soft, #f3eeff)'
                    : 'transparent',
                  color: isActive
                    ? 'var(--primary, #7c3aed)'
                    : 'var(--text-secondary, #4a5a72)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? 'inset 0 1px 0 rgba(255, 255, 255, 0.8)' : 'none',
                }}
              >
                <Icon size={16} style={{ color: isActive ? 'var(--primary, #7c3aed)' : 'var(--text-muted)' }} />
                <span>{tab.label}</span>
                {tab.badge ? (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '1px 6px',
                      borderRadius: '999px',
                      background: isActive ? 'var(--primary, #7c3aed)' : 'var(--bg-muted)',
                      color: isActive ? '#fff' : 'var(--text-muted)',
                      fontWeight: 600,
                    }}
                  >
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            )
          })}
      </nav>

      {/* ========================================================================= */}
      {/* WORKSPACE 1: OVERVIEW (FLUENT METRO COMMAND CENTER)                       */}
      {/* ========================================================================= */}
      {activeTab === 'OVERVIEW' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* COMPACT METRO KPI TILES (5-COLUMN BALANCED GRID) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div
              className="card card-interactive"
              style={{ padding: '14px 16px', cursor: 'pointer' }}
              onClick={() => setActiveTab('ITEMS')}
              title="Click to view full inventory catalog"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Items
                </span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(124, 58, 237, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={16} color="var(--primary)" />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono, monospace)', fontVariantNumeric: 'tabular-nums' }}>
                {metrics?.totalItems || items.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {categories.length} categories active &rarr;
              </div>
            </div>

            <div
              className="card card-interactive"
              style={{ padding: '14px 16px', cursor: 'pointer' }}
              onClick={() => setActiveTab('STORES')}
              title="Click to view live store stock balances"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Stock Valuation
                </span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={16} color="var(--success)" />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono, monospace)', fontVariantNumeric: 'tabular-nums' }}>
                {inr(metrics?.totalInventoryValueCents || 0, { compact: true })}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Across {locations.length} store locations &rarr;
              </div>
            </div>

            <div
              className="card card-interactive"
              style={{ padding: '14px 16px', cursor: 'pointer' }}
              onClick={() => {
                setActiveTab('REPORTS')
                setReportSubTab('LOW_STOCK')
              }}
              title="Click to view items requiring reorder"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Low Stock Alerts
                </span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: (metrics?.lowStockItemsCount || 0) > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={16} color={(metrics?.lowStockItemsCount || 0) > 0 ? 'var(--danger)' : 'var(--warning)'} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: (metrics?.lowStockItemsCount || 0) > 0 ? 'var(--danger)' : 'var(--text-primary)', fontFamily: 'var(--font-mono, monospace)', fontVariantNumeric: 'tabular-nums' }}>
                {metrics?.lowStockItemsCount || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: (metrics?.lowStockItemsCount || 0) > 0 ? 'var(--danger)' : 'var(--text-muted)', marginTop: 4 }}>
                {(metrics?.lowStockItemsCount || 0) > 0 ? 'Shortage attention required &rarr;' : 'All stock levels healthy'}
              </div>
            </div>

            <div
              className="card card-interactive"
              style={{ padding: '14px 16px', cursor: 'pointer' }}
              onClick={() => {
                setActiveTab('DISTRIBUTION')
                setDistSubTab('REQUISITIONS')
              }}
              title="Click to view material requisitions"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Pending Requisitions
                </span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={16} color="var(--info)" />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono, monospace)', fontVariantNumeric: 'tabular-nums' }}>
                {metrics?.pendingMaterialRequestsCount || requests.filter((r) => r.status === 'PENDING').length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Classroom material requests &rarr;
              </div>
            </div>

            <div
              className="card card-interactive"
              style={{ padding: '14px 16px', cursor: 'pointer' }}
              onClick={() => setActiveTab('PROCUREMENT')}
              title="Click to view open purchase orders"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Open Orders
                </span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(20, 184, 166, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={16} color="var(--secondary)" />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono, monospace)', fontVariantNumeric: 'tabular-nums' }}>
                {metrics?.openPurchaseOrdersCount || orders.filter((o) => o.status === 'ORDERED' || o.status === 'ISSUED').length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Pending delivery & GRN &rarr;
              </div>
            </div>
          </div>

          {/* BALANCED 2-COLUMN OPERATIONAL DASHBOARD */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: 18, alignItems: 'start' }}>
            {/* LEFT COLUMN: RECENT ACTIVITY & DISTRIBUTIONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* RECENT CLASSROOM & STUDENT DISTRIBUTIONS */}
              <div
                className="card"
                style={{
                  padding: 18,
                  borderRadius: 'var(--radius-lg, 16px)',
                  border: '1px solid var(--border-default, #e2e8f0)',
                  background: 'var(--surface-card, #ffffff)',
                  boxShadow: 'var(--elevation-1)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Layers size={16} color="var(--primary)" /> Recent Distributions & Material Issues
                  </h3>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => {
                      setActiveTab('DISTRIBUTION')
                      setDistSubTab('ALL_DISTRIBUTIONS')
                    }}
                    style={{ fontSize: '0.78rem' }}
                  >
                    View All &rarr;
                  </button>
                </div>

                {distributions.slice(0, 5).length > 0 ? (
                  <div style={{ border: '1px solid var(--border-subtle, #eef2f8)', borderRadius: 'var(--radius-md, 10px)', overflow: 'hidden' }}>
                    <table className="table" style={{ width: '100%', margin: 0, fontSize: '0.82rem' }}>
                      <thead>
                        <tr>
                          <th>Issue #</th>
                          <th>Recipient Context</th>
                          <th>Items Issued</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {distributions.slice(0, 5).map((d) => (
                          <tr key={d.id}>
                            <td style={{ fontWeight: 600 }}>{d.issueNumber}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className={`badge ${d.destinationType === 'STUDENT' ? 'b-purple' : d.destinationType === 'CLASSROOM' ? 'b-blue' : 'b-neutral'}`} style={{ fontSize: '0.68rem' }}>
                                  {d.destinationType}
                                </span>
                                <span style={{ fontWeight: 500 }}>
                                  {d.destinationType === 'STUDENT'
                                    ? `${d.student?.firstName || d.recipientName || 'Student'} (${d.student?.admissionNo || 'Admitted'})`
                                    : d.destinationType === 'CLASSROOM'
                                    ? d.classroom?.name || 'Classroom'
                                    : d.recipientName || 'Staff'}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span style={{ color: 'var(--text-secondary)' }}>
                                {d.items?.map((it: any) => `${it.quantity}x ${it.item?.name}`).join(', ') || 'Supplies'}
                              </span>
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(d.issueDate || d.createdAt)}</td>
                            <td><StatusBadge status={d.status} /></td>
                            <td>
                              <button className="btn btn-sm btn-ghost" onClick={() => openDrawer('DISTRIBUTION', d)} title="Inspect">
                                <Eye size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '24px 16px',
                      textAlign: 'center',
                      background: 'var(--bg-subtle, #f8fafd)',
                      borderRadius: 'var(--radius-md, 12px)',
                      border: '1px dashed var(--border-default, #e2e8f0)',
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'rgba(124, 58, 237, 0.08)',
                        color: 'var(--primary, #7c3aed)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 10,
                      }}
                    >
                      <Layers size={20} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 12 }}>
                      No Distributions Recorded Yet
                    </div>
                    {!isTeacher && canManageStock && (
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button className="btn btn-sm btn-primary" onClick={() => setClassroomDistModalOpen(true)}>
                          <GraduationCap size={14} /> Classroom Issue
                        </button>
                        <button className="btn btn-sm btn-outline" onClick={() => setStudentDistModalOpen(true)}>
                          <User size={14} /> Student Handover
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: PROCUREMENT & FINANCE RECONCILIATION */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* FINANCE PAYABLES SUMMARY */}
              <div
                className="card"
                style={{
                  padding: 18,
                  borderRadius: 'var(--radius-lg, 16px)',
                  border: '1px solid var(--border-default, #e2e8f0)',
                  background: 'var(--surface-card, #ffffff)',
                  boxShadow: 'var(--elevation-1)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <DollarSign size={16} color="var(--success)" /> Procurement & Finance Alignment
                  </h3>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => {
                      setActiveTab('REPORTS')
                      setReportSubTab('FINANCE')
                    }}
                    style={{ fontSize: '0.75rem' }}
                  >
                    Reconciliation &rarr;
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ padding: '10px 12px', background: 'var(--bg-subtle, #f8fafd)', borderRadius: 10, border: '1px solid var(--border-subtle, #eef2f8)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>PO Committed</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: 2, color: 'var(--text-primary)' }}>
                      {inr(reconciliation?.totalPOCommittedCents || 0, { compact: true })}
                    </div>
                  </div>
                  <div style={{ padding: '10px 12px', background: 'var(--bg-subtle, #f8fafd)', borderRadius: 10, border: '1px solid var(--border-subtle, #eef2f8)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>GRN Received</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: 2, color: 'var(--text-primary)' }}>
                      {inr(reconciliation?.totalGRNValueCents || 0, { compact: true })}
                    </div>
                  </div>
                  <div style={{ padding: '10px 12px', background: 'var(--bg-subtle, #f8fafd)', borderRadius: 10, border: '1px solid var(--border-subtle, #eef2f8)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Vendor Bills Posted</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: 2, color: 'var(--text-primary)' }}>
                      {inr(reconciliation?.totalVendorBillsPostedCents || 0, { compact: true })}
                    </div>
                  </div>
                  <div style={{ padding: '10px 12px', background: 'var(--bg-subtle, #f8fafd)', borderRadius: 10, border: '1px solid var(--border-subtle, #eef2f8)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Net Payable Balance</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: 2, color: 'var(--danger, #ef4444)' }}>
                      {inr(reconciliation?.vendorPayableBalanceCents || 0, { compact: true })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WORKSPACE 2: ITEMS & STOCK                                                */}
      {/* ========================================================================= */}
      {activeTab === 'ITEMS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Standardized Workspace Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Items & Stock Directory
              </h2>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-sm btn-outline" onClick={() => setCategoryModalOpen(true)}>
                <Tag size={14} /> New Category
              </button>
              <button className="btn btn-sm btn-outline" onClick={() => setUnitModalOpen(true)}>
                <Layers size={14} /> New Unit
              </button>
              {canManageStock && (
                <button className="btn btn-sm btn-primary" onClick={() => setItemModalOpen(true)}>
                  <Plus size={14} /> Add Inventory Item
                </button>
              )}
            </div>
          </div>

          {/* Unified Filter Bar Surface */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              background: 'var(--surface-card, #ffffff)',
              border: '1px solid var(--border-default, #e2e8f0)',
              borderRadius: 'var(--radius-lg, 16px)',
              boxShadow: 'var(--elevation-1)',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
              <div style={{ position: 'relative', width: 280 }}>
                <Search size={15} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input"
                  placeholder="Search by name, SKU or code..."
                  style={{ paddingLeft: 34, height: 36, fontSize: '0.85rem' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="input"
                style={{ width: 190, height: 36, fontSize: '0.85rem' }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="ALL">All Categories ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing <strong>{filteredItems.length}</strong> {filteredItems.length === 1 ? 'item' : 'items'}
            </div>
          </div>

          {/* Table Card */}
          <div
            className="card"
            style={{
              overflowX: 'auto',
              borderRadius: 'var(--radius-lg, 16px)',
              border: '1px solid var(--border-default, #e2e8f0)',
              background: 'var(--surface-card, #ffffff)',
              boxShadow: 'var(--elevation-1)',
              padding: 0,
            }}
          >
            <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle, #f8fafd)', borderBottom: '1px solid var(--border-default, #e2e8f0)' }}>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Code</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Item Name</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Category</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Type</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Unit</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Cost Price</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Reorder Level</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '40px 20px', textAlign: 'center' }}>
                      <div style={{ maxWidth: 360, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--preone-primary-soft, #f3eeff)', color: 'var(--primary, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                          <Package size={22} />
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: searchQuery || categoryFilter !== 'ALL' ? 4 : 14 }}>
                          {searchQuery || categoryFilter !== 'ALL' ? 'No Matching Items' : 'No Inventory Items Yet'}
                        </div>
                        {(searchQuery || categoryFilter !== 'ALL') && (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0 0 16px 0' }}>
                            Try adjusting your search terms or category filter.
                          </p>
                        )}
                        {canManageStock && (
                          <button className="btn btn-sm btn-primary" onClick={() => setItemModalOpen(true)}>
                            <Plus size={14} /> Add Inventory Item
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((it) => (
                    <tr key={it.id} style={{ borderBottom: '1px solid var(--border-subtle, #f1f5f9)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.85rem' }}>{it.code}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 500 }}>{it.name}</td>
                      <td style={{ padding: '12px 14px' }}>{it.category?.name || 'Unassigned'}</td>
                      <td style={{ padding: '12px 14px' }}><StatusBadge status={it.itemType} /></td>
                      <td style={{ padding: '12px 14px' }}>{it.unit?.name} ({it.unit?.symbol})</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>{inr(it.costPriceCents || 0)}</td>
                      <td style={{ padding: '12px 14px' }}>{it.reorderPoint}</td>
                      <td style={{ padding: '12px 14px' }}><StatusBadge status={it.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                      <td style={{ padding: '12px 14px' }}>
                        <button className="btn btn-sm btn-ghost" onClick={() => openDrawer('ITEM', it)} title="Inspect Item & Balances">
                          <Eye size={14} /> Stock Card
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WORKSPACE 3: REQUESTS & DISTRIBUTION (FIRST-CLASS COMMAND CENTER)         */}
      {/* ========================================================================= */}
      {activeTab === 'DISTRIBUTION' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Standardized Workspace Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Requests & Preschool Material Distribution
              </h2>
            </div>

            {/* Launchers */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {!isTeacher && canManageStock && (
                <>
                  <button className="btn btn-sm btn-primary" onClick={() => setClassroomDistModalOpen(true)}>
                    <GraduationCap size={14} /> Classroom Issue
                  </button>
                  <button className="btn btn-sm btn-primary" onClick={() => setStudentDistModalOpen(true)}>
                    <User size={14} /> Student Issue
                  </button>
                  <button className="btn btn-sm btn-outline" onClick={() => setDeptDistModalOpen(true)}>
                    <Building2 size={14} /> Dept Issue
                  </button>
                </>
              )}
              <button className="btn btn-sm btn-outline" onClick={() => setRequestModalOpen(true)}>
                <Sparkles size={14} /> Raise Requisition
              </button>
            </div>
          </div>

          {/* Fluent Metro Segmented Navigation Bar for Sub-tabs */}
          <div
            style={{
              display: 'flex',
              gap: 6,
              background: 'var(--surface-card, #ffffff)',
              padding: 5,
              borderRadius: 'var(--radius-lg, 16px)',
              border: '1px solid var(--border-default, #e2e8f0)',
              boxShadow: 'var(--elevation-1)',
              overflowX: 'auto',
            }}
          >
            {[
              { key: 'ALL_DISTRIBUTIONS', label: `All Distributions (${distributions.length})`, icon: Sparkles },
              { key: 'CLASSROOM_DIST', label: 'Classroom Bulk Distribution', icon: GraduationCap },
              { key: 'STUDENT_DIST', label: 'Individual Student Distribution', icon: User },
              { key: 'STAFF_DEPT_DIST', label: 'Department Issues', icon: Building2 },
              { key: 'REQUISITIONS', label: `Requisitions Queue (${requests.length})`, icon: Clock, badge: requests.filter((r) => r.status === 'PENDING').length || undefined },
            ].map((st) => {
              const isActive = distSubTab === st.key
              const Icon = st.icon
              return (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setDistSubTab(st.key as any)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    fontWeight: isActive ? 600 : 500,
                    borderRadius: 'var(--radius-md, 10px)',
                    border: isActive
                      ? '1px solid color-mix(in srgb, var(--primary, #7c3aed) 28%, transparent)'
                      : '1px solid transparent',
                    background: isActive ? 'var(--preone-primary-soft, #f3eeff)' : 'transparent',
                    color: isActive ? 'var(--primary, #7c3aed)' : 'var(--text-secondary, #4a5a72)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={14} />
                  <span>{st.label}</span>
                  {st.badge ? (
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: 999,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: 'var(--danger, #ef4444)',
                        color: '#ffffff',
                      }}
                    >
                      {st.badge}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>

          {/* Search & Filter Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              background: 'var(--surface-card, #ffffff)',
              border: '1px solid var(--border-default, #e2e8f0)',
              borderRadius: 'var(--radius-lg, 16px)',
              boxShadow: 'var(--elevation-1)',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ position: 'relative', width: 320 }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input"
                placeholder={distSubTab === 'REQUISITIONS' ? 'Search requisitions by request #, staff or classroom...' : 'Search by issue #, student name, classroom or recipient...'}
                style={{ paddingLeft: 34, height: 36, fontSize: '0.85rem' }}
                value={distSearch}
                onChange={(e) => setDistSearch(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {distSubTab === 'REQUISITIONS' ? (
                <>Showing <strong>{requests.length}</strong> requisition {requests.length === 1 ? 'request' : 'requests'}</>
              ) : (
                <>Showing <strong>{filteredDistributions.length}</strong> {filteredDistributions.length === 1 ? 'distribution record' : 'distribution records'}</>
              )}
            </div>
          </div>

          {/* VIEW: REQUISITIONS QUEUE */}
          {distSubTab === 'REQUISITIONS' ? (
            <div
              className="card"
              style={{
                overflowX: 'auto',
                borderRadius: 'var(--radius-lg, 16px)',
                border: '1px solid var(--border-default, #e2e8f0)',
                background: 'var(--surface-card, #ffffff)',
                boxShadow: 'var(--elevation-1)',
                padding: 0,
              }}
            >
              <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle, #f8fafd)', borderBottom: '1px solid var(--border-default, #e2e8f0)' }}>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Request #</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Classroom / Context</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Requested By</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Required By</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Items Requested</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Priority</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Status</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center' }}>
                        <div style={{ maxWidth: 360, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(59, 130, 246, 0.1)', color: 'var(--info, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                            <Clock size={22} />
                          </div>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                            Requisitions Queue Empty
                          </div>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0 0 16px 0' }}>
                            No material requisitions are waiting in the queue. Teachers and administrators can raise requisitions for supplies.
                          </p>
                          <button className="btn btn-sm btn-primary" onClick={() => setRequestModalOpen(true)}>
                            <Sparkles size={14} /> Raise Requisition
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    requests.map((r) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--border-subtle, #f1f5f9)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.85rem' }}>{r.requestNumber}</td>
                        <td style={{ padding: '12px 14px' }}>{r.classroom?.name || 'School Operations'}</td>
                        <td style={{ padding: '12px 14px' }}>{r.requestedBy?.name || 'Staff Member'}</td>
                        <td style={{ padding: '12px 14px' }}>{fmtDate(r.requiredByDate)}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: '0.85rem' }}>
                            {r.items?.map((it: any) => `${it.quantityRequested}x ${it.item?.name}`).join(', ')}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span className={`badge ${r.priority === 'HIGH' || r.priority === 'URGENT' ? 'b-danger' : 'b-neutral'}`}>
                            {r.priority}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}><StatusBadge status={r.status} /></td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <button className="btn btn-sm btn-ghost" onClick={() => openDrawer('REQUEST', r)} title="Inspect Details">
                              <Eye size={14} />
                            </button>
                            {r.status === 'PENDING' && canApprove ? (
                              <>
                                <button className="btn btn-sm btn-primary" onClick={() => handleApproveRequest(r.id)}>
                                  Approve
                                </button>
                                <button className="btn btn-sm btn-outline" onClick={() => handleRejectRequest(r.id)}>
                                  Reject
                                </button>
                              </>
                            ) : null}
                            {r.status === 'APPROVED' && canManageStock ? (
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => {
                                  setSelectedClassroomId(r.classroomId || '')
                                  const validIssueItems = r.items?.map((it: any) => ({ itemId: it.itemId, quantity: it.quantityApproved || it.quantityRequested })) || [{ itemId: '', quantity: 1 }]
                                  setDistLines(validIssueItems)
                                  setClassroomDistModalOpen(true)
                                }}
                              >
                                <GraduationCap size={13} /> Fulfill Issue
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* VIEW: DISTRIBUTION LOGS (ALL, CLASSROOM, STUDENT, DEPT) */
            <div
              className="card"
              style={{
                overflowX: 'auto',
                borderRadius: 'var(--radius-lg, 16px)',
                border: '1px solid var(--border-default, #e2e8f0)',
                background: 'var(--surface-card, #ffffff)',
                boxShadow: 'var(--elevation-1)',
                padding: 0,
              }}
            >
              <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle, #f8fafd)', borderBottom: '1px solid var(--border-default, #e2e8f0)' }}>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Issue #</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Type</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Recipient / Destination Context</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Source Store</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Items & Quantities</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Issued By</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Date</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Purpose / Notes</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDistributions.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '40px 20px', textAlign: 'center' }}>
                        <div style={{ maxWidth: 380, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--preone-primary-soft, #f3eeff)', color: 'var(--primary, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                            <GraduationCap size={22} />
                          </div>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: distSearch ? 4 : 14 }}>
                            {distSearch ? 'No Matching Distributions' : 'No Distributions Recorded'}
                          </div>
                          {distSearch && (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0 0 16px 0' }}>
                              No distribution records match your current filter query.
                            </p>
                          )}
                          {!isTeacher && canManageStock && (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="btn btn-sm btn-primary" onClick={() => setClassroomDistModalOpen(true)}>
                                <GraduationCap size={14} /> Classroom Issue
                              </button>
                              <button className="btn btn-sm btn-outline" onClick={() => setStudentDistModalOpen(true)}>
                                <User size={14} /> Student Issue
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDistributions.map((d) => (
                      <tr key={d.id} style={{ borderBottom: '1px solid var(--border-subtle, #f1f5f9)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.85rem' }}>{d.issueNumber}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span className={`badge ${d.destinationType === 'STUDENT' ? 'b-purple' : d.destinationType === 'CLASSROOM' ? 'b-blue' : 'b-neutral'}`}>
                            {d.destinationType}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {d.destinationType === 'STUDENT' ? (
                            <div>
                              <div style={{ fontWeight: 600 }}>
                                {d.student ? `${d.student.firstName} ${d.student.lastName || ''}`.trim() : d.recipientName || 'Student'}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Adm: {d.student?.admissionNo || 'N/A'} {d.classroom?.name ? `· ${d.classroom.name}` : ''}
                              </div>
                            </div>
                          ) : d.destinationType === 'CLASSROOM' ? (
                            <div>
                              <div style={{ fontWeight: 600 }}>{d.classroom?.name || 'Classroom'}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Teacher: {d.recipientName || d.classroom?.primaryTeacher?.fullName || 'Assigned Staff'}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontWeight: 600 }}>{enumLabel(d.destinationType)}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recipient: {d.recipientName || 'Department'}</div>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px' }}>{d.location?.name || 'Main Store'}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: '0.85rem' }}>
                            {d.items?.map((it: any) => `${it.quantity}x ${it.item?.name || 'Item'} (${it.item?.unit?.symbol || 'unit'})`).join(', ')}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>{d.issuedByName || 'Storekeeper'}</td>
                        <td style={{ padding: '12px 14px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{fmtDate(d.issueDate || d.createdAt)}</td>
                        <td style={{ padding: '12px 14px', fontSize: '0.85rem' }}>{d.notes || '—'}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <button className="btn btn-sm btn-ghost" onClick={() => openDrawer('DISTRIBUTION', d)} title="Inspect Distribution Record">
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* WORKSPACE 4: STORES & TRANSFERS                                           */}
      {/* ========================================================================= */}
      {activeTab === 'STORES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Standardized Workspace Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Stores & Inter-Store Transfers
              </h2>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-sm btn-outline" onClick={() => setLocationModalOpen(true)}>
                <MapPin size={14} /> Add Store Location
              </button>
              <button className="btn btn-sm btn-outline" onClick={() => setTransferModalOpen(true)}>
                <ArrowLeftRight size={14} /> Transfer Stock
              </button>
              <button className="btn btn-sm btn-outline" onClick={() => setReturnModalOpen(true)}>
                <RotateCcw size={14} /> Return Materials
              </button>
              <button className="btn btn-sm btn-outline" onClick={() => setAdjustModalOpen(true)}>
                <Boxes size={14} /> Physical Count Audit
              </button>
              <button className="btn btn-sm btn-primary" onClick={() => setClassroomDistModalOpen(true)}>
                <GraduationCap size={14} /> Issue to Classroom
              </button>
            </div>
          </div>

          {/* Location Summary Cards */}
          {locations.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              {locations.map((loc) => {
                const locStocks = stocks.filter((s) => s.locationId === loc.id)
                const totalUnits = locStocks.reduce((sum, s) => sum + Number(s.quantity || 0), 0)
                return (
                  <div
                    key={loc.id}
                    style={{
                      padding: 16,
                      background: 'var(--surface-card, #ffffff)',
                      border: '1px solid var(--border-default, #e2e8f0)',
                      borderRadius: 'var(--radius-lg, 16px)',
                      boxShadow: 'var(--elevation-1)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 'var(--radius-md, 10px)',
                            background: 'var(--preone-primary-soft, #f3eeff)',
                            color: 'var(--primary, #7c3aed)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Warehouse size={16} />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{loc.name}</span>
                      </div>
                      <span className="badge b-neutral" style={{ fontSize: '0.7rem', fontFamily: 'monospace' }}>{loc.code}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{enumLabel(loc.locationType || 'MAIN_STORE')}</div>
                    <div style={{ marginTop: 4, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {totalUnits} <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)' }}>units stored</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Unified Filter Bar Surface */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              background: 'var(--surface-card, #ffffff)',
              border: '1px solid var(--border-default, #e2e8f0)',
              borderRadius: 'var(--radius-lg, 16px)',
              boxShadow: 'var(--elevation-1)',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ position: 'relative', width: 320 }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input"
                placeholder="Search store stocks by item name, SKU, location, or batch..."
                style={{ paddingLeft: 34, height: 36, fontSize: '0.85rem' }}
                value={storeSearch}
                onChange={(e) => setStoreSearch(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing <strong>{filteredStocks.length}</strong> stock {filteredStocks.length === 1 ? 'record' : 'records'} across <strong>{locations.length}</strong> locations
            </div>
          </div>

          {/* Live Store Stock Table */}
          <div
            className="card"
            style={{
              overflowX: 'auto',
              borderRadius: 'var(--radius-lg, 16px)',
              border: '1px solid var(--border-default, #e2e8f0)',
              background: 'var(--surface-card, #ffffff)',
              boxShadow: 'var(--elevation-1)',
              padding: 0,
            }}
          >
            <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle, #f8fafd)', borderBottom: '1px solid var(--border-default, #e2e8f0)' }}>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Location</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Item Code</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Item Name</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Batch #</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>On Hand</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Reserved</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Available</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Expiry Date</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '40px 20px', textAlign: 'center' }}>
                      <div style={{ maxWidth: 380, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                          <Warehouse size={22} />
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: storeSearch ? 4 : 14 }}>
                          {storeSearch ? 'No Matching Stock Balances' : 'No Active Store Stock'}
                        </div>
                        {storeSearch && (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0 0 16px 0' }}>
                            No stock records match the specified query.
                          </p>
                        )}
                        {canManageStock && (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-sm btn-primary" onClick={() => setTransferModalOpen(true)}>
                              <ArrowLeftRight size={14} /> Transfer Stock
                            </button>
                            <button className="btn btn-sm btn-outline" onClick={() => setAdjustModalOpen(true)}>
                              <Boxes size={14} /> Physical Count Audit
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((stk) => (
                    <tr key={stk.id} style={{ borderBottom: '1px solid var(--border-subtle, #f1f5f9)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>{stk.location?.name} <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>({stk.location?.code})</span></td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '0.85rem' }}>{stk.item?.code}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 500 }}>{stk.item?.name}</td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '0.82rem' }}>{stk.batchNumber || '—'}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>{stk.quantity} {stk.item?.unit?.symbol}</td>
                      <td style={{ padding: '12px 14px' }}>{stk.reservedQuantity} {stk.item?.unit?.symbol}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--success, #16a34a)', fontWeight: 700 }}>{stk.availableQuantity} {stk.item?.unit?.symbol}</td>
                      <td style={{ padding: '12px 14px' }}>{stk.expiryDate ? fmtDate(stk.expiryDate) : 'N/A'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <button className="btn btn-sm btn-ghost" onClick={() => openDrawer('STOCK', stk)} title="Inspect Stock Details">
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WORKSPACE 5: PROCUREMENT (PURCHASE ORDERS)                                */}
      {/* ========================================================================= */}
      {activeTab === 'PROCUREMENT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Standardized Workspace Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Procurement & Purchase Orders
              </h2>
            </div>
            {canProcure && (
              <button className="btn btn-sm btn-primary" onClick={() => setPoModalOpen(true)}>
                <Plus size={14} /> Create Purchase Order
              </button>
            )}
          </div>

          {/* Unified Filter Bar Surface */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              background: 'var(--surface-card, #ffffff)',
              border: '1px solid var(--border-default, #e2e8f0)',
              borderRadius: 'var(--radius-lg, 16px)',
              boxShadow: 'var(--elevation-1)',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ position: 'relative', width: 320 }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input"
                placeholder="Search purchase orders by PO #, vendor, or status..."
                style={{ paddingLeft: 34, height: 36, fontSize: '0.85rem' }}
                value={poSearch}
                onChange={(e) => setPoSearch(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing <strong>{filteredOrders.length}</strong> purchase {filteredOrders.length === 1 ? 'order' : 'orders'}
            </div>
          </div>

          {/* Purchase Orders Table Card */}
          <div
            className="card"
            style={{
              overflowX: 'auto',
              borderRadius: 'var(--radius-lg, 16px)',
              border: '1px solid var(--border-default, #e2e8f0)',
              background: 'var(--surface-card, #ffffff)',
              boxShadow: 'var(--elevation-1)',
              padding: 0,
            }}
          >
            <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle, #f8fafd)', borderBottom: '1px solid var(--border-default, #e2e8f0)' }}>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>PO #</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Vendor</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Order Date</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Expected Delivery</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Grand Total</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center' }}>
                      <div style={{ maxWidth: 380, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(20, 184, 166, 0.1)', color: 'var(--secondary, #14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                          <ShoppingCart size={22} />
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: poSearch ? 4 : 14 }}>
                          {poSearch ? 'No Matching Purchase Orders' : 'No Purchase Orders Yet'}
                        </div>
                        {poSearch && (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0 0 16px 0' }}>
                            No purchase orders match your search parameters.
                          </p>
                        )}
                        {canProcure && (
                          <button className="btn btn-sm btn-primary" onClick={() => setPoModalOpen(true)}>
                            <Plus size={14} /> Create Purchase Order
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((po) => (
                    <tr key={po.id} style={{ borderBottom: '1px solid var(--border-subtle, #f1f5f9)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.85rem' }}>{po.poNumber}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 500 }}>{po.vendor?.name}</td>
                      <td style={{ padding: '12px 14px' }}>{fmtDate(po.orderDate)}</td>
                      <td style={{ padding: '12px 14px' }}>{fmtDate(po.expectedDeliveryDate)}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700 }}>{inr(po.grandTotalCents)}</td>
                      <td style={{ padding: '12px 14px' }}><StatusBadge status={po.status} /></td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button className="btn btn-sm btn-ghost" onClick={() => openDrawer('PO', po)} title="Inspect PO">
                            <Eye size={14} />
                          </button>
                          {po.status === 'DRAFT' && canApprove && (
                            <button className="btn btn-sm btn-primary" onClick={() => handleApprovePO(po.id)}>
                              Approve
                            </button>
                          )}
                          {(po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED') && (
                            <button className="btn btn-sm btn-outline" onClick={() => openGRNModal(po)}>
                              <Truck size={14} /> Receive Goods
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WORKSPACE 6: RECEIVING (GRN)                                              */}
      {/* ========================================================================= */}
      {activeTab === 'RECEIVING' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Standardized Workspace Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Goods Receiving (GRN)
              </h2>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Total Receipts: <strong>{grns.length}</strong>
            </div>
          </div>

          {/* Unified Filter Bar Surface */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              background: 'var(--surface-card, #ffffff)',
              border: '1px solid var(--border-default, #e2e8f0)',
              borderRadius: 'var(--radius-lg, 16px)',
              boxShadow: 'var(--elevation-1)',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ position: 'relative', width: 320 }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input"
                placeholder="Search GRNs by number, PO reference, or vendor..."
                style={{ paddingLeft: 34, height: 36, fontSize: '0.85rem' }}
                value={grnSearch}
                onChange={(e) => setGrnSearch(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing <strong>{filteredGrns.length}</strong> goods receipt {filteredGrns.length === 1 ? 'note' : 'notes'}
            </div>
          </div>

          {/* GRN Table Card */}
          <div
            className="card"
            style={{
              overflowX: 'auto',
              borderRadius: 'var(--radius-lg, 16px)',
              border: '1px solid var(--border-default, #e2e8f0)',
              background: 'var(--surface-card, #ffffff)',
              boxShadow: 'var(--elevation-1)',
              padding: 0,
            }}
          >
            <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle, #f8fafd)', borderBottom: '1px solid var(--border-default, #e2e8f0)' }}>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>GRN #</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>PO Reference</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Vendor</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Received Date</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Total Value</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrns.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center' }}>
                      <div style={{ maxWidth: 380, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(59, 130, 246, 0.1)', color: 'var(--info, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                          <Truck size={22} />
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: grnSearch ? 4 : 14 }}>
                          {grnSearch ? 'No Matching Goods Receipts' : 'No Goods Receipts Recorded'}
                        </div>
                        {grnSearch && (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0 0 16px 0' }}>
                            No GRN records match your search criteria.
                          </p>
                        )}
                        {canProcure && (
                          <button className="btn btn-sm btn-outline" onClick={() => setActiveTab('PROCUREMENT')}>
                            <ShoppingCart size={14} /> View Purchase Orders
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredGrns.map((grn) => (
                    <tr key={grn.id} style={{ borderBottom: '1px solid var(--border-subtle, #f1f5f9)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.85rem' }}>{grn.grnNumber}</td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '0.85rem' }}>{grn.purchaseOrder?.poNumber || 'Direct'}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 500 }}>{grn.vendor?.name}</td>
                      <td style={{ padding: '12px 14px' }}>{fmtDate(grn.receivedDate)}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700 }}>{inr(grn.totalReceivedValueCents)}</td>
                      <td style={{ padding: '12px 14px' }}><StatusBadge status={grn.status} /></td>
                      <td style={{ padding: '12px 14px' }}>
                        <button className="btn btn-sm btn-ghost" onClick={() => openDrawer('GRN', grn)} title="Inspect GRN Details">
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WORKSPACE 7: VENDORS                                                      */}
      {/* ========================================================================= */}
      {activeTab === 'VENDORS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Standardized Workspace Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Approved Vendors & Educational Suppliers
              </h2>
            </div>
            {canProcure && (
              <button className="btn btn-sm btn-primary" onClick={() => setVendorModalOpen(true)}>
                <Plus size={14} /> Register Approved Vendor
              </button>
            )}
          </div>

          {/* Unified Filter Bar Surface */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              background: 'var(--surface-card, #ffffff)',
              border: '1px solid var(--border-default, #e2e8f0)',
              borderRadius: 'var(--radius-lg, 16px)',
              boxShadow: 'var(--elevation-1)',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ position: 'relative', width: 320 }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input"
                placeholder="Search vendors by name, code, contact, or GSTIN..."
                style={{ paddingLeft: 34, height: 36, fontSize: '0.85rem' }}
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing <strong>{filteredVendors.length}</strong> approved {filteredVendors.length === 1 ? 'vendor' : 'vendors'}
            </div>
          </div>

          {/* Vendors Table Card */}
          <div
            className="card"
            style={{
              overflowX: 'auto',
              borderRadius: 'var(--radius-lg, 16px)',
              border: '1px solid var(--border-default, #e2e8f0)',
              background: 'var(--surface-card, #ffffff)',
              boxShadow: 'var(--elevation-1)',
              padding: 0,
            }}
          >
            <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle, #f8fafd)', borderBottom: '1px solid var(--border-default, #e2e8f0)' }}>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Vendor Name</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Code</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Contact Person</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Email</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Phone</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>GSTIN / PAN</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Payment Terms</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center' }}>
                      <div style={{ maxWidth: 380, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124, 58, 237, 0.1)', color: 'var(--primary, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                          <Building2 size={22} />
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: vendorSearch ? 4 : 14 }}>
                          {vendorSearch ? 'No Matching Vendors' : 'No Vendors Registered'}
                        </div>
                        {vendorSearch && (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0 0 16px 0' }}>
                            No approved vendors match your query.
                          </p>
                        )}
                        {canProcure && (
                          <button className="btn btn-sm btn-primary" onClick={() => setVendorModalOpen(true)}>
                            <Plus size={14} /> Register Approved Vendor
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((v) => (
                    <tr key={v.id} style={{ borderBottom: '1px solid var(--border-subtle, #f1f5f9)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>{v.name}</td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '0.85rem' }}>{v.code}</td>
                      <td style={{ padding: '12px 14px' }}>{v.contactPerson || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>{v.email || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>{v.phone || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                          {v.gstin || v.pan || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>{v.paymentTerms || 'NET_30'}</td>
                      <td style={{ padding: '12px 14px' }}><StatusBadge status={v.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WORKSPACE 8: REPORTS & AUDIT                                              */}
      {/* ========================================================================= */}
      {activeTab === 'REPORTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Standardized Workspace Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Inventory Reports & Audit Ledger
              </h2>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-sm btn-outline" onClick={() => exportCsv('movements')}>
                <Download size={13} /> Export Ledger CSV
              </button>
              <button className="btn btn-sm btn-outline" onClick={() => exportCsv('consumption')}>
                <Download size={13} /> Export Consumption CSV
              </button>
            </div>
          </div>

          {/* Fluent Metro Segmented Sub-tab Navigation */}
          <div
            style={{
              display: 'flex',
              gap: 6,
              background: 'var(--surface-card, #ffffff)',
              padding: 5,
              borderRadius: 'var(--radius-lg, 16px)',
              border: '1px solid var(--border-default, #e2e8f0)',
              boxShadow: 'var(--elevation-1)',
              overflowX: 'auto',
            }}
          >
            {[
              { key: 'LEDGER', label: 'Stock Movement Ledger', icon: Boxes },
              { key: 'STUDENT_REPORT', label: 'Student-Wise Distribution', icon: User },
              { key: 'CLASSROOM_REPORT', label: 'Classroom Consumption', icon: GraduationCap },
              { key: 'STAFF_REPORT', label: 'Department Issues', icon: Building2 },
              { key: 'LOW_STOCK', label: `Low Stock Watchlist (${lowStockList.length})`, icon: AlertTriangle, badge: lowStockList.length || undefined },
              { key: 'EXPIRY', label: `Batch Expiry (${expiringList.length})`, icon: Calendar },
              { key: 'FINANCE', label: 'Finance Payables', icon: DollarSign },
            ].map((st) => {
              const isActive = reportSubTab === st.key
              const Icon = st.icon
              return (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setReportSubTab(st.key as any)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    fontWeight: isActive ? 600 : 500,
                    borderRadius: 'var(--radius-md, 10px)',
                    border: isActive
                      ? '1px solid color-mix(in srgb, var(--primary, #7c3aed) 28%, transparent)'
                      : '1px solid transparent',
                    background: isActive ? 'var(--preone-primary-soft, #f3eeff)' : 'transparent',
                    color: isActive ? 'var(--primary, #7c3aed)' : 'var(--text-secondary, #4a5a72)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={14} />
                  <span>{st.label}</span>
                  {st.badge ? (
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: 999,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: 'var(--warning, #f59e0b)',
                        color: '#ffffff',
                      }}
                    >
                      {st.badge}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>

          {/* SUB-VIEW 1: STOCK MOVEMENT LEDGER */}
          {reportSubTab === 'LEDGER' && (
            <div
              className="card"
              style={{
                overflowX: 'auto',
                borderRadius: 'var(--radius-lg, 16px)',
                border: '1px solid var(--border-default, #e2e8f0)',
                background: 'var(--surface-card, #ffffff)',
                boxShadow: 'var(--elevation-1)',
                padding: 0,
              }}
            >
              <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle, #f8fafd)', borderBottom: '1px solid var(--border-default, #e2e8f0)' }}>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Timestamp</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Movement Type</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Item</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Store Location</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Quantity</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Reference</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Performed By</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Reason / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center' }}>
                        <div style={{ maxWidth: 360, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--preone-primary-soft, #f3eeff)', color: 'var(--primary, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                            <Boxes size={22} />
                          </div>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 0 }}>
                            No Stock Movements Recorded
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    movements.map((m) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--border-subtle, #f1f5f9)' }}>
                        <td style={{ padding: '12px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{fmtDate(m.createdAt)}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            className={`badge ${
                              m.movementType.includes('IN') || m.movementType.includes('ADD') || m.movementType === 'RECEIPT' || m.movementType === 'RETURN'
                                ? 'b-success'
                                : m.movementType.includes('OUT') || m.movementType.includes('SUB') || m.movementType === 'ISSUE' || m.movementType === 'DAMAGE'
                                ? 'b-danger'
                                : 'b-neutral'
                            }`}
                          >
                            {m.movementType}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>{m.item?.name || m.item?.code || 'Item'}</td>
                        <td style={{ padding: '12px 14px' }}>{m.location?.name || 'Store'}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 700 }}>{m.quantity}</td>
                        <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.referenceType || 'DIRECT'}</td>
                        <td style={{ padding: '12px 14px' }}>{m.performedByName || 'Staff'}</td>
                        <td style={{ padding: '12px 14px', fontSize: '0.85rem' }}>{m.reason || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* SUB-VIEW 2: STUDENT-WISE DISTRIBUTION REPORT */}
          {reportSubTab === 'STUDENT_REPORT' && (
            <div
              className="card"
              style={{
                overflowX: 'auto',
                borderRadius: 'var(--radius-lg, 16px)',
                border: '1px solid var(--border-default, #e2e8f0)',
                background: 'var(--surface-card, #ffffff)',
                boxShadow: 'var(--elevation-1)',
                padding: 0,
              }}
            >
              <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle, #f8fafd)', borderBottom: '1px solid var(--border-default, #e2e8f0)' }}>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Issue #</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Student Name</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Admission No</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Classroom</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Items Received</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Issued By</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Date</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Purpose / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {distributions.filter((d) => d.destinationType === 'STUDENT').length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center' }}>
                        <div style={{ maxWidth: 360, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124, 58, 237, 0.1)', color: 'var(--primary, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                            <User size={22} />
                          </div>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 14 }}>
                            No Student Distributions Yet
                          </div>
                          {!isTeacher && canManageStock && (
                            <button className="btn btn-sm btn-primary" onClick={() => setStudentDistModalOpen(true)}>
                              <User size={14} /> Allocate to Student
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    distributions
                      .filter((d) => d.destinationType === 'STUDENT')
                      .map((d) => (
                        <tr key={d.id} style={{ borderBottom: '1px solid var(--border-subtle, #f1f5f9)' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.85rem' }}>{d.issueNumber}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                            {d.student ? `${d.student.firstName} ${d.student.lastName || ''}`.trim() : d.recipientName || 'Student'}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span className="badge b-neutral" style={{ fontFamily: 'monospace' }}>
                              {d.student?.admissionNo || 'Admitted'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>{d.classroom?.name || 'Assigned Class'}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ fontSize: '0.85rem' }}>
                              {d.items?.map((it: any) => `${it.quantity}x ${it.item?.name}`).join(', ')}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>{d.issuedByName || 'Storekeeper'}</td>
                          <td style={{ padding: '12px 14px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{fmtDate(d.issueDate || d.createdAt)}</td>
                          <td style={{ padding: '12px 14px', fontSize: '0.85rem' }}>{d.notes || '—'}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* SUB-VIEW 3: CLASSROOM-WISE CONSUMPTION REPORT */}
          {reportSubTab === 'CLASSROOM_REPORT' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                className="card"
                style={{
                  padding: 18,
                  borderRadius: 'var(--radius-lg, 16px)',
                  border: '1px solid var(--border-default, #e2e8f0)',
                  background: 'var(--surface-card, #ffffff)',
                  boxShadow: 'var(--elevation-1)',
                }}
              >
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 14, color: 'var(--text-primary)' }}>
                  Consumption by Destination Category
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  {(Array.isArray(analytics?.byDestination)
                    ? analytics.byDestination
                    : analytics?.byDestination && typeof analytics.byDestination === 'object'
                      ? Object.entries(analytics.byDestination).map(([destinationType, d]: [string, any]) => ({
                          destinationType,
                          totalValueCents: d.totalValueCents ?? Math.round((d.value || 0) * 100),
                        }))
                      : []
                  ).map((d: any) => (
                    <div
                      key={d.destinationType}
                      style={{
                        padding: 14,
                        background: 'var(--bg-subtle, #f8fafd)',
                        border: '1px solid var(--border-subtle, #eef2f8)',
                        borderRadius: 'var(--radius-md, 12px)',
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.destinationType}</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 4, color: 'var(--text-primary)' }}>
                        {inr(d.totalValueCents || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="card"
                style={{
                  overflowX: 'auto',
                  borderRadius: 'var(--radius-lg, 16px)',
                  border: '1px solid var(--border-default, #e2e8f0)',
                  background: 'var(--surface-card, #ffffff)',
                  boxShadow: 'var(--elevation-1)',
                  padding: 0,
                }}
              >
                <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle, #f8fafd)', borderBottom: '1px solid var(--border-default, #e2e8f0)' }}>
                      <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Classroom</th>
                      <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Total Consumed Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!Array.isArray(analytics?.byClassroom) || analytics.byClassroom.length === 0) ? (
                      <tr>
                        <td colSpan={2} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No classroom consumption recorded yet.</td>
                      </tr>
                    ) : (
                      analytics.byClassroom.map((c: any) => (
                        <tr key={c.classroomId} style={{ borderBottom: '1px solid var(--border-subtle, #f1f5f9)' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 600 }}>{c.classroomName || c.name || c.classroomId}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 700 }}>{inr(c.totalValueCents || 0)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-VIEW 4: STAFF & DEPT ISSUE HISTORY */}
          {reportSubTab === 'STAFF_REPORT' && (
            <div
              className="card"
              style={{
                overflowX: 'auto',
                borderRadius: 'var(--radius-lg, 16px)',
                border: '1px solid var(--border-default, #e2e8f0)',
                background: 'var(--surface-card, #ffffff)',
                boxShadow: 'var(--elevation-1)',
                padding: 0,
              }}
            >
              <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle, #f8fafd)', borderBottom: '1px solid var(--border-default, #e2e8f0)' }}>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Issue #</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Department</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Recipient Staff</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Items Issued</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Issuing Store</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Issued By</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Date</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {distributions.filter((d) => ['STAFF', 'KITCHEN', 'CLEANING', 'FIRST_AID', 'OPERATIONS'].includes(d.destinationType)).length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: 36, color: 'var(--text-muted)' }}>
                        No staff or departmental distributions recorded.
                      </td>
                    </tr>
                  ) : (
                    distributions
                      .filter((d) => ['STAFF', 'KITCHEN', 'CLEANING', 'FIRST_AID', 'OPERATIONS'].includes(d.destinationType))
                      .map((d) => (
                        <tr key={d.id} style={{ borderBottom: '1px solid var(--border-subtle, #f1f5f9)' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.85rem' }}>{d.issueNumber}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span className="badge b-neutral">{d.destinationType}</span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>{d.recipientName || 'Staff Member'}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ fontSize: '0.85rem' }}>
                              {d.items?.map((it: any) => `${it.quantity}x ${it.item?.name}`).join(', ')}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>{d.location?.name || 'Main Store'}</td>
                          <td style={{ padding: '12px 14px' }}>{d.issuedByName}</td>
                          <td style={{ padding: '12px 14px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{fmtDate(d.issueDate || d.createdAt)}</td>
                          <td style={{ padding: '12px 14px', fontSize: '0.85rem' }}>{d.notes || '—'}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* SUB-VIEW 5: LOW STOCK WATCHLIST */}
          {reportSubTab === 'LOW_STOCK' && (
            <div
              className="card"
              style={{
                overflowX: 'auto',
                borderRadius: 'var(--radius-lg, 16px)',
                border: '1px solid var(--border-default, #e2e8f0)',
                background: 'var(--surface-card, #ffffff)',
                boxShadow: 'var(--elevation-1)',
                padding: 0,
              }}
            >
              <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle, #f8fafd)', borderBottom: '1px solid var(--border-default, #e2e8f0)' }}>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Item Code</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Item Name</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Available Qty</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Reorder Level</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Reorder Qty</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Shortfall</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockList.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '36px 20px', textAlign: 'center' }}>
                        <div style={{ maxWidth: 360, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                            <CheckCircle2 size={20} />
                          </div>
                          <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: 0 }}>
                            All Stock Levels Healthy
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    lowStockList.map((item: any) => {
                      const avail = item.availableQuantity ?? 0
                      const reorder = item.reorderPoint ?? 10
                      const shortfall = Math.max(0, reorder - avail)
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle, #f1f5f9)' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.85rem' }}>{item.code}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 500 }}>{item.name}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--danger, #ef4444)' }}>{avail} {item.unit?.symbol}</td>
                          <td style={{ padding: '12px 14px' }}>{reorder} {item.unit?.symbol}</td>
                          <td style={{ padding: '12px 14px' }}>{item.reorderQuantity || 20} {item.unit?.symbol}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span className="badge b-danger">-{shortfall} deficit</span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            {canProcure && (
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => {
                                  setPoLines([{ itemId: item.id, quantityOrdered: item.reorderQuantity || 20, unitPriceCents: item.costPriceCents || 1000, taxRatePercent: 0 }])
                                  setPoModalOpen(true)
                                }}
                              >
                                Create PO
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* SUB-VIEW 6: BATCH EXPIRY */}
          {reportSubTab === 'EXPIRY' && (
            <div
              className="card"
              style={{
                overflowX: 'auto',
                borderRadius: 'var(--radius-lg, 16px)',
                border: '1px solid var(--border-default, #e2e8f0)',
                background: 'var(--surface-card, #ffffff)',
                boxShadow: 'var(--elevation-1)',
                padding: 0,
              }}
            >
              <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle, #f8fafd)', borderBottom: '1px solid var(--border-default, #e2e8f0)' }}>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Item</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Batch #</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Store Location</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Current Quantity</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Expiry Date</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Urgency</th>
                  </tr>
                </thead>
                <tbody>
                  {expiringList.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '36px 20px', textAlign: 'center' }}>
                        <div style={{ maxWidth: 360, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.12)', color: 'var(--info, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                            <CheckCircle2 size={20} />
                          </div>
                          <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: 0 }}>
                            No Upcoming Expirations
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    expiringList.map((stk: any) => (
                      <tr key={stk.id} style={{ borderBottom: '1px solid var(--border-subtle, #f1f5f9)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>{stk.item?.name} <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>({stk.item?.code})</span></td>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '0.85rem' }}>{stk.batchNumber || '—'}</td>
                        <td style={{ padding: '12px 14px' }}>{stk.location?.name}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 700 }}>{stk.quantity}</td>
                        <td style={{ padding: '12px 14px' }}>{fmtDate(stk.expiryDate)}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span className="badge b-warning">Expiring Soon</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* SUB-VIEW 7: FINANCE PAYABLES */}
          {reportSubTab === 'FINANCE' && (
            <div
              className="card"
              style={{
                padding: 20,
                borderRadius: 'var(--radius-lg, 16px)',
                border: '1px solid var(--border-default, #e2e8f0)',
                background: 'var(--surface-card, #ffffff)',
                boxShadow: 'var(--elevation-1)',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
                Finance & Vendor Payables Reconciliation
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
                <div style={{ padding: 16, background: 'var(--bg-subtle, #f8fafd)', border: '1px solid var(--border-subtle, #eef2f8)', borderRadius: 'var(--radius-md, 12px)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total PO Committed</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: 4, color: 'var(--text-primary)' }}>{inr(reconciliation?.totalPOCommittedCents || 0)}</div>
                </div>
                <div style={{ padding: 16, background: 'var(--bg-subtle, #f8fafd)', border: '1px solid var(--border-subtle, #eef2f8)', borderRadius: 'var(--radius-md, 12px)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Goods Received Value (GRN)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: 4, color: 'var(--text-primary)' }}>{inr(reconciliation?.totalGRNValueCents || 0)}</div>
                </div>
                <div style={{ padding: 16, background: 'var(--bg-subtle, #f8fafd)', border: '1px solid var(--border-subtle, #eef2f8)', borderRadius: 'var(--radius-md, 12px)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Vendor Bills Posted</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: 4, color: 'var(--text-primary)' }}>{inr(reconciliation?.totalVendorBillsPostedCents || 0)}</div>
                </div>
                <div style={{ padding: 16, background: 'var(--bg-subtle, #f8fafd)', border: '1px solid var(--border-subtle, #eef2f8)', borderRadius: 'var(--radius-md, 12px)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Net Vendor Payable</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: 4, color: 'var(--danger, #ef4444)' }}>{inr(reconciliation?.vendorPayableBalanceCents || 0)}</div>
                </div>
              </div>
              
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SIDE PEEK INSPECTOR DRAWER                                               */}
      {/* ========================================================================= */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={
          drawerType === 'REQUEST'
            ? `Requisition ${drawerData?.requestNumber || ''}`
            : drawerType === 'PO'
            ? `Purchase Order ${drawerData?.poNumber || ''}`
            : drawerType === 'GRN'
            ? `Goods Receipt ${drawerData?.grnNumber || ''}`
            : drawerType === 'ITEM'
            ? `Item: ${drawerData?.name || ''}`
            : drawerType === 'DISTRIBUTION'
            ? `Distribution Record ${drawerData?.issueNumber || ''}`
            : `Store Stock Balance`
        }
        subtitle={
          drawerType === 'REQUEST'
            ? `Requested by ${drawerData?.requestedBy?.name || 'Staff'} for ${drawerData?.classroom?.name || 'General'}`
            : drawerType === 'PO'
            ? `Vendor: ${drawerData?.vendor?.name || 'Supplier'} · Delivery: ${fmtDate(drawerData?.expectedDeliveryDate)}`
            : drawerType === 'GRN'
            ? `Received on ${fmtDate(drawerData?.receivedDate)}`
            : drawerType === 'ITEM'
            ? `SKU: ${drawerData?.code} · Category: ${drawerData?.category?.name || 'Unassigned'}`
            : drawerType === 'DISTRIBUTION'
            ? `${drawerData?.destinationType} issue by ${drawerData?.issuedByName || 'Storekeeper'} on ${fmtDate(drawerData?.issueDate || drawerData?.createdAt)}`
            : `Physical location balance`
        }
        icon={
          drawerType === 'REQUEST' ? <Sparkles size={20} /> : drawerType === 'PO' ? <ShoppingCart size={20} /> : drawerType === 'GRN' ? <Truck size={20} /> : <Package size={20} />
        }
        iconClass="ic-blue"
      >
        {drawerData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* INSPECT DISTRIBUTION RECORD */}
            {drawerType === 'DISTRIBUTION' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 6 }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Destination Type</div>
                    <div style={{ fontWeight: 600 }}>{drawerData.destinationType}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status</div>
                    <StatusBadge status={drawerData.status} />
                  </div>
                </div>

                {drawerData.destinationType === 'STUDENT' ? (
                  <div style={{ padding: 12, background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 6 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enrolled Student Recipient</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: 2 }}>
                      {drawerData.student ? `${drawerData.student.firstName} ${drawerData.student.lastName || ''}`.trim() : drawerData.recipientName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Admission No: {drawerData.student?.admissionNo || 'N/A'} {drawerData.classroom?.name ? `· Class: ${drawerData.classroom.name}` : ''}
                    </div>
                  </div>
                ) : drawerData.destinationType === 'CLASSROOM' ? (
                  <div style={{ padding: 12, background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 6 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Classroom Destination</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: 2 }}>{drawerData.classroom?.name || 'Classroom'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Teacher / Recipient: {drawerData.recipientName || drawerData.classroom?.primaryTeacher?.fullName || 'Assigned Staff'}
                    </div>
                  </div>
                ) : null}

                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>Itemized Supplies Issued</h4>
                  <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 6, overflow: 'hidden' }}>
                    <table className="table" style={{ width: '100%', margin: 0, fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Quantity</th>
                          <th>Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {drawerData.items?.map((it: any) => (
                          <tr key={it.id}>
                            <td style={{ fontWeight: 600 }}>{it.item?.name || it.itemId}</td>
                            <td style={{ fontWeight: 700 }}>{it.quantity}</td>
                            <td>{it.item?.unit?.symbol || 'pcs'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 4 }}>Purpose & Acknowledgment Notes</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--foreground)', background: 'var(--surface)', padding: 10, border: '1px solid var(--border-subtle)', borderRadius: 6 }}>
                    {drawerData.notes || 'Preschool distribution verified and acknowledged.'}
                  </p>
                </div>
              </>
            )}

            {/* INSPECT MATERIAL REQUEST */}
            {drawerType === 'REQUEST' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 6 }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Status: </span>
                    <StatusBadge status={drawerData.status} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Priority: </span>
                    <span className="badge b-neutral">{drawerData.priority}</span>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>Purpose & Justification</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--foreground)', background: 'var(--surface)', padding: 10, border: '1px solid var(--border-subtle)', borderRadius: 6 }}>
                    {drawerData.reason || 'No description entered.'}
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>Itemized Supplies Requested</h4>
                  <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 6, overflow: 'hidden' }}>
                    <table className="table" style={{ width: '100%', margin: 0, fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Qty Req</th>
                          <th>Qty Appr</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {drawerData.items?.map((it: any) => (
                          <tr key={it.id}>
                            <td style={{ fontWeight: 600 }}>{it.item?.name || it.itemId}</td>
                            <td>{it.quantityRequested}</td>
                            <td>{it.quantityApproved ?? it.quantityRequested}</td>
                            <td style={{ color: 'var(--text-muted)' }}>{it.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {drawerData.status === 'PENDING' && canApprove && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleApproveRequest(drawerData.id)}>
                      Approve Requisition
                    </button>
                    <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => handleRejectRequest(drawerData.id)}>
                      Reject
                    </button>
                  </div>
                )}
              </>
            )}

            {/* INSPECT PURCHASE ORDER */}
            {drawerType === 'PO' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 6 }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vendor Contact</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{drawerData.vendor?.contactPerson || drawerData.vendor?.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{drawerData.vendor?.phone || drawerData.vendor?.email}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Grand Total</div>
                    <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--primary)' }}>{inr(drawerData.grandTotalCents)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Terms: {drawerData.paymentTerms}</div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>Order Items & Receiving Status</h4>
                  <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 6, overflow: 'hidden' }}>
                    <table className="table" style={{ width: '100%', margin: 0, fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Ordered</th>
                          <th>Received</th>
                          <th>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {drawerData.items?.map((it: any) => (
                          <tr key={it.id}>
                            <td style={{ fontWeight: 600 }}>{it.item?.name}</td>
                            <td>{it.quantityOrdered}</td>
                            <td style={{ fontWeight: 700, color: it.quantityReceived >= it.quantityOrdered ? 'var(--success)' : 'var(--warning)' }}>
                              {it.quantityReceived}
                            </td>
                            <td>{inr(it.unitPriceCents)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  {drawerData.status === 'DRAFT' && canApprove && (
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleApprovePO(drawerData.id)}>
                      Approve Purchase Order
                    </button>
                  )}
                  {(drawerData.status === 'ORDERED' || drawerData.status === 'PARTIALLY_RECEIVED') && (
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      onClick={() => {
                        setDrawerOpen(false)
                        openGRNModal(drawerData)
                      }}
                    >
                      <Truck size={15} /> Receive Goods (GRN)
                    </button>
                  )}
                </div>
              </>
            )}

            {/* INSPECT GRN */}
            {drawerType === 'GRN' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 6 }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Invoice / Challan</div>
                    <div style={{ fontWeight: 600 }}>{drawerData.vendorInvoiceNumber || drawerData.challanNumber || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Received Value</div>
                    <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--success)' }}>{inr(drawerData.totalReceivedValueCents)}</div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>Received Items & Batches</h4>
                  <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 6, overflow: 'hidden' }}>
                    <table className="table" style={{ width: '100%', margin: 0, fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Qty Received</th>
                          <th>Batch #</th>
                        </tr>
                      </thead>
                      <tbody>
                        {drawerData.items?.map((it: any) => (
                          <tr key={it.id}>
                            <td style={{ fontWeight: 600 }}>{it.item?.name || it.itemId}</td>
                            <td style={{ fontWeight: 700 }}>{it.quantityReceived}</td>
                            <td>{it.batchNumber || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ padding: 10, background: 'var(--bg-subtle)', borderRadius: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <ShieldCheck size={14} style={{ display: 'inline', marginRight: 4, color: 'var(--success)' }} />
                  Inventory stock balances automatically incremented and finance vendor bill booked.
                </div>
              </>
            )}

            {/* INSPECT ITEM STOCK CARD */}
            {drawerType === 'ITEM' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 6 }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Measurement Unit</div>
                    <div style={{ fontWeight: 600 }}>{drawerData.unit?.name} ({drawerData.unit?.symbol})</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cost Price</div>
                    <div style={{ fontWeight: 700 }}>{inr(drawerData.costPriceCents || 0)}</div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>Store Location Distribution</h4>
                  <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 6, overflow: 'hidden' }}>
                    <table className="table" style={{ width: '100%', margin: 0, fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Location</th>
                          <th>Batch</th>
                          <th>On Hand</th>
                          <th>Available</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stocks.filter((s) => s.itemId === drawerData.id).length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: 16, color: 'var(--text-muted)' }}>
                              No stock recorded in any store location.
                            </td>
                          </tr>
                        ) : (
                          stocks
                            .filter((s) => s.itemId === drawerData.id)
                            .map((stk) => (
                              <tr key={stk.id}>
                                <td style={{ fontWeight: 600 }}>{stk.location?.name}</td>
                                <td>{stk.batchNumber || '—'}</td>
                                <td style={{ fontWeight: 700 }}>{stk.quantity}</td>
                                <td style={{ color: 'var(--success)', fontWeight: 600 }}>{stk.availableQuantity}</td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                    onClick={() => {
                      setDrawerOpen(false)
                      setDistLines([{ itemId: drawerData.id, quantity: 1 }])
                      setClassroomDistModalOpen(true)
                    }}
                  >
                    Classroom Issue
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                    onClick={() => {
                      setDrawerOpen(false)
                      setDistLines([{ itemId: drawerData.id, quantity: 1 }])
                      setStudentDistModalOpen(true)
                    }}
                  >
                    Student Issue
                  </button>
                </div>
              </>
            )}

            {/* INSPECT STOCK RECORD */}
            {drawerType === 'STOCK' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 6 }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location</div>
                    <div style={{ fontWeight: 600 }}>{drawerData.location?.name} ({drawerData.location?.code})</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Batch Number</div>
                    <div style={{ fontWeight: 600 }}>{drawerData.batchNumber || 'Unbatched'}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div style={{ padding: 10, background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 6 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total On Hand</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{drawerData.quantity}</div>
                  </div>
                  <div style={{ padding: 10, background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 6 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reserved</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{drawerData.reservedQuantity}</div>
                  </div>
                  <div style={{ padding: 10, background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 6 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Available</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--success)' }}>{drawerData.availableQuantity}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Drawer>

      {/* ========================================================================= */}
      {/* ALL MODALS                                                                */}
      {/* ========================================================================= */}

      {/* MODAL: CLASSROOM BULK DISTRIBUTION (JOURNEY 3) */}
      <Modal
        open={classroomDistModalOpen}
        onClose={() => setClassroomDistModalOpen(false)}
        title="Classroom Bulk Distribution"
        icon={<GraduationCap size={20} />}
        iconClass="ic-blue"
        wide
      >
        <form onSubmit={handleClassroomDistributionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>
            <Field label="Target Classroom" required>
              <select
                name="classroomId"
                className="input"
                value={selectedClassroomId}
                onChange={(e) => setSelectedClassroomId(e.target.value)}
                required
              >
                <option value="">-- Choose Classroom --</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code}) — {c.students || 0} students
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Source Store Location" required>
              <select
                name="fromLocationId"
                className="input"
                value={selectedDistLocationId}
                onChange={(e) => setSelectedDistLocationId(e.target.value)}
                required
              >
                <option value="">-- Select Store --</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Context Banner: Assigned Teacher and Enrolled Count */}
          {selectedClassroomId && (
            <div style={{ padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned Primary Teacher: </span>
                <span style={{ fontWeight: 600 }}>{classrooms.find((c) => c.id === selectedClassroomId)?.teacher || 'General Staff'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Classroom Capacity: </span>
                <span style={{ fontWeight: 600 }}>{classrooms.find((c) => c.id === selectedClassroomId)?.capacity || 20} children</span>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Recipient / Acknowledged By" required>
              <input
                type="text"
                name="recipientName"
                className="input"
                placeholder="e.g. Priya Teacher"
                defaultValue={classrooms.find((c) => c.id === selectedClassroomId)?.teacher || ''}
                required
              />
            </Field>

            <Field label="Distribution Purpose / Activity" required>
              <input type="text" name="purpose" className="input" placeholder="e.g. Painting activity, Montessori block play" required />
            </Field>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Items to Distribute</label>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setDistLines([...distLines, { itemId: '', quantity: 1 }])}
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            {distLines.map((line, idx) => {
              const avail = getAvailableStockAtLocation(line.itemId, selectedDistLocationId)
              return (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1.2fr auto', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <select
                      className="input"
                      value={line.itemId}
                      onChange={(e) => {
                        const updated = [...distLines]
                        updated[idx].itemId = e.target.value
                        setDistLines(updated)
                      }}
                      required
                    >
                      <option value="">-- Choose Item --</option>
                      {items.map((it) => (
                        <option key={it.id} value={it.id}>{it.name} ({it.unit?.symbol})</option>
                      ))}
                    </select>
                    {line.itemId && (
                      <div style={{ fontSize: '0.75rem', marginTop: 2, color: avail > 0 ? 'var(--success)' : 'var(--danger)' }}>
                        Available in store: <strong>{avail} units</strong>
                      </div>
                    )}
                  </div>

                  <input
                    type="number"
                    min="1"
                    max={avail || undefined}
                    className="input"
                    placeholder="Qty"
                    value={line.quantity}
                    onChange={(e) => {
                      const updated = [...distLines]
                      updated[idx].quantity = Number(e.target.value)
                      setDistLines(updated)
                    }}
                    required
                  />

                  {distLines.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setDistLines(distLines.filter((_, i) => i !== idx))}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <Field label="Delivery Notes / Storage Cupboard">
            <input type="text" name="notes" className="input" placeholder="e.g. Placed in Toddler Sunshine Cupboard A" />
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setClassroomDistModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>Complete Classroom Distribution</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: INDIVIDUAL STUDENT DISTRIBUTION (JOURNEY 4) */}
      <Modal
        open={studentDistModalOpen}
        onClose={() => setStudentDistModalOpen(false)}
        title="Individual Student Distribution"
        icon={<User size={20} />}
        iconClass="ic-purple"
        wide
      >
        <form onSubmit={handleStudentDistributionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>
            <Field label="Search & Select Enrolled Student" required>
              <select
                name="studentId"
                className="input"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                required
              >
                <option value="">-- Choose Student --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName || ''} (Adm: {s.admissionNo})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Source Store Location" required>
              <select
                name="fromLocationId"
                className="input"
                value={selectedDistLocationId}
                onChange={(e) => setSelectedDistLocationId(e.target.value)}
                required
              >
                <option value="">-- Select Store --</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Context Banner: Selected Student Context */}
          {selectedStudentId && (
            <div style={{ padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Student Name: </span>
                <span style={{ fontWeight: 600 }}>
                  {students.find((s) => s.id === selectedStudentId)?.firstName} {students.find((s) => s.id === selectedStudentId)?.lastName || ''}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Admission #: </span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                  {students.find((s) => s.id === selectedStudentId)?.admissionNo}
                </span>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Distribution Reason / Purpose" required>
              <input type="text" name="purpose" className="input" placeholder="e.g. Annual Uniform Distribution, Welcome Kit" required />
            </Field>

            <Field label="Acknowledgment / Parent Contact">
              <input type="text" name="notes" className="input" placeholder="e.g. Handed over to mother at pickup" />
            </Field>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Items to Issue</label>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setDistLines([...distLines, { itemId: '', quantity: 1 }])}
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            {distLines.map((line, idx) => {
              const avail = getAvailableStockAtLocation(line.itemId, selectedDistLocationId)
              return (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1.2fr auto', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <select
                      className="input"
                      value={line.itemId}
                      onChange={(e) => {
                        const updated = [...distLines]
                        updated[idx].itemId = e.target.value
                        setDistLines(updated)
                      }}
                      required
                    >
                      <option value="">-- Choose Item (Uniform / Kit / Book) --</option>
                      {items.map((it) => (
                        <option key={it.id} value={it.id}>{it.name} ({it.unit?.symbol})</option>
                      ))}
                    </select>
                    {line.itemId && (
                      <div style={{ fontSize: '0.75rem', marginTop: 2, color: avail > 0 ? 'var(--success)' : 'var(--danger)' }}>
                        Available in store: <strong>{avail} units</strong>
                      </div>
                    )}
                  </div>

                  <input
                    type="number"
                    min="1"
                    max={avail || undefined}
                    className="input"
                    placeholder="Qty"
                    value={line.quantity}
                    onChange={(e) => {
                      const updated = [...distLines]
                      updated[idx].quantity = Number(e.target.value)
                      setDistLines(updated)
                    }}
                    required
                  />

                  {distLines.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setDistLines(distLines.filter((_, i) => i !== idx))}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setStudentDistModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>Complete Student Distribution</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: DEPARTMENT / STAFF DISTRIBUTION */}
      <Modal
        open={deptDistModalOpen}
        onClose={() => setDeptDistModalOpen(false)}
        title="Department & Operations Issue"
        icon={<Building2 size={20} />}
        iconClass="ic-orange"
        wide
      >
        <form onSubmit={handleDeptDistributionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Destination Department" required>
              <select name="destinationType" className="input" defaultValue="KITCHEN" required>
                <option value="KITCHEN">Kitchen & Pantry</option>
                <option value="FIRST_AID">Infirmary / First Aid</option>
                <option value="CLEANING">Cleaning & Sanitization</option>
                <option value="OPERATIONS">General Operations</option>
                <option value="STAFF">Administrative Staff</option>
              </select>
            </Field>

            <Field label="Source Store Location" required>
              <select name="fromLocationId" className="input" required>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                ))}
              </select>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Recipient Staff Name" required>
              <input type="text" name="recipientName" className="input" placeholder="e.g. Ramesh Chef / Sister Mary" required />
            </Field>

            <Field label="Purpose" required>
              <input type="text" name="purpose" className="input" placeholder="e.g. Weekly kitchen groceries replenishment" required />
            </Field>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Items to Issue</label>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setDistLines([...distLines, { itemId: '', quantity: 1 }])}
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            {distLines.map((line, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1.2fr auto', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <select
                  className="input"
                  value={line.itemId}
                  onChange={(e) => {
                    const updated = [...distLines]
                    updated[idx].itemId = e.target.value
                    setDistLines(updated)
                  }}
                  required
                >
                  <option value="">-- Choose Item --</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>{it.name} ({it.unit?.symbol})</option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  className="input"
                  placeholder="Qty"
                  value={line.quantity}
                  onChange={(e) => {
                    const updated = [...distLines]
                    updated[idx].quantity = Number(e.target.value)
                    setDistLines(updated)
                  }}
                  required
                />

                {distLines.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setDistLines(distLines.filter((_, i) => i !== idx))}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setDeptDistModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>Complete Department Issue</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: TEACHER / STAFF REQUISITIONS */}
      <Modal
        open={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        title="Request Materials & Supplies"
        icon={<Sparkles size={20} />}
        iconClass="ic-purple"
        wide
      >
        <form onSubmit={handleCreateRequest} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Classroom" required>
              <select name="classroomId" className="input" required>
                <option value="">-- Select Classroom --</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </Field>

            <Field label="Required By Date">
              <input type="date" name="requiredByDate" className="input" defaultValue={new Date().toISOString().slice(0, 10)} />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Priority">
              <select name="priority" className="input" defaultValue="MEDIUM">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent (Today/Tomorrow)</option>
              </select>
            </Field>

            <Field label="Purpose / Reason" required>
              <input type="text" name="reason" className="input" placeholder="e.g. Painting activity, Montessori block play" required />
            </Field>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Requested Items</label>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setRequestLines([...requestLines, { itemId: '', quantityRequested: 1, notes: '' }])}
              >
                <Plus size={14} /> Add Another Item
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {requestLines.map((line, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 2fr auto', gap: 8, alignItems: 'center' }}>
                  <select
                    className="input"
                    value={line.itemId}
                    onChange={(e) => {
                      const updated = [...requestLines]
                      updated[idx].itemId = e.target.value
                      setRequestLines(updated)
                    }}
                    required
                  >
                    <option value="">-- Choose Item --</option>
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>{it.name} ({it.unit?.symbol})</option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    className="input"
                    placeholder="Qty"
                    value={line.quantityRequested}
                    onChange={(e) => {
                      const updated = [...requestLines]
                      updated[idx].quantityRequested = Number(e.target.value)
                      setRequestLines(updated)
                    }}
                    required
                  />

                  <input
                    type="text"
                    className="input"
                    placeholder="Notes (e.g. Red color, pack of 12)"
                    value={line.notes}
                    onChange={(e) => {
                      const updated = [...requestLines]
                      updated[idx].notes = e.target.value
                      setRequestLines(updated)
                    }}
                  />

                  {requestLines.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setRequestLines(requestLines.filter((_, i) => i !== idx))}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setRequestModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>Submit Requisition</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD INVENTORY ITEM */}
      <Modal
        open={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        title="Add Inventory Item"
        icon={<Package size={20} />}
        iconClass="ic-blue"
        wide
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setBusy(true)
            const fd = new FormData(e.currentTarget)
            try {
              const res = await fetch('/api/v1/inventory/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: fd.get('name'),
                  code: fd.get('code'),
                  categoryId: fd.get('categoryId'),
                  unitId: fd.get('unitId'),
                  itemType: fd.get('itemType'),
                  costPriceCents: Math.round(Number(fd.get('costPrice') || 0) * 100),
                  reorderPoint: Number(fd.get('reorderPoint') || 10),
                  reorderQuantity: Number(fd.get('reorderQuantity') || 20),
                  trackExpiry: fd.get('trackExpiry') === 'on',
                }),
              })
              const json = await res.json()
              setBusy(false)
              if (json.success) {
                toast.success('Item Added', `${json.data.name} saved`)
                setItemModalOpen(false)
                loadItems()
              } else {
                toast.error('Failed', json.error?.message)
              }
            } catch (err: any) {
              setBusy(false)
              toast.error('Error', err.message)
            }
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <Field label="Item Name" required>
              <input type="text" name="name" className="input" placeholder="e.g. Non-toxic Finger Paint (500ml)" required />
            </Field>
            <Field label="Item Code / SKU" required>
              <input type="text" name="code" className="input" placeholder="e.g. ART-PNT-500" required />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Field label="Category" required>
              <select name="categoryId" className="input" required>
                <option value="">-- Choose Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Item Type" required>
              <select name="itemType" className="input" defaultValue="CONSUMABLE" required>
                <option value="CONSUMABLE">Consumable</option>
                <option value="STATIONERY">Stationery</option>
                <option value="LEARNING_KIT">Learning Kit</option>
                <option value="ASSET">Asset (Durable)</option>
                <option value="UNIFORM">Uniform</option>
                <option value="FIRST_AID">First Aid</option>
                <option value="CLEANING">Cleaning Supplies</option>
                <option value="KITCHEN_PANTRY">Kitchen & Pantry</option>
              </select>
            </Field>

            <Field label="Measurement Unit" required>
              <select name="unitId" className="input" required>
                <option value="">-- Choose Unit --</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                ))}
              </select>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Field label="Cost Price (₹)">
              <input type="number" step="0.01" name="costPrice" className="input" placeholder="0.00" />
            </Field>
            <Field label="Reorder Point">
              <input type="number" name="reorderPoint" className="input" defaultValue="10" />
            </Field>
            <Field label="Reorder Quantity">
              <input type="number" name="reorderQuantity" className="input" defaultValue="20" />
            </Field>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
            <input type="checkbox" name="trackExpiry" /> Track Batch Expiry (Recommended for first aid, kitchen & paints)
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setItemModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>Save Item</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CREATE PURCHASE ORDER */}
      <Modal
        open={poModalOpen}
        onClose={() => setPoModalOpen(false)}
        title="Create Purchase Order"
        icon={<ShoppingCart size={20} />}
        iconClass="ic-green"
        wide
      >
        <form onSubmit={handleCreatePO} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Vendor" required>
              <select name="vendorId" className="input" required>
                <option value="">-- Select Vendor --</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name} ({v.code})</option>
                ))}
              </select>
            </Field>

            <Field label="Store / Receiving Location" required>
              <select name="destinationLocationId" className="input" required>
                <option value="">-- Select Store --</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                ))}
              </select>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Expected Delivery Date">
              <input type="date" name="expectedDeliveryDate" className="input" defaultValue={new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)} />
            </Field>

            <Field label="Payment Terms">
              <select name="paymentTerms" className="input" defaultValue="NET_30">
                <option value="IMMEDIATE">Immediate / Cash</option>
                <option value="NET_15">Net 15 Days</option>
                <option value="NET_30">Net 30 Days</option>
                <option value="NET_60">Net 60 Days</option>
                <option value="ADVANCE">Advance Required</option>
              </select>
            </Field>
          </div>

          <Field label="Shipping Address / Delivery Instructions">
            <input type="text" name="shippingAddress" className="input" placeholder="e.g. Preschool Campus, Gate 2 Store Room" />
          </Field>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Purchase Items</label>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setPoLines([...poLines, { itemId: '', quantityOrdered: 10, unitPriceCents: 1000, taxRatePercent: 0 }])}
              >
                <Plus size={14} /> Add Line Item
              </button>
            </div>

            {poLines.map((line, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr 1fr auto', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <select
                  className="input"
                  value={line.itemId}
                  onChange={(e) => {
                    const updated = [...poLines]
                    updated[idx].itemId = e.target.value
                    const found = items.find((it) => it.id === e.target.value)
                    if (found && found.costPriceCents) {
                      updated[idx].unitPriceCents = found.costPriceCents
                    }
                    setPoLines(updated)
                  }}
                  required
                >
                  <option value="">-- Choose Item --</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>{it.name} ({it.unit?.symbol})</option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  className="input"
                  placeholder="Qty"
                  value={line.quantityOrdered}
                  onChange={(e) => {
                    const updated = [...poLines]
                    updated[idx].quantityOrdered = Number(e.target.value)
                    setPoLines(updated)
                  }}
                  required
                />

                <input
                  type="number"
                  step="0.01"
                  className="input"
                  placeholder="Price (₹)"
                  value={line.unitPriceCents / 100}
                  onChange={(e) => {
                    const updated = [...poLines]
                    updated[idx].unitPriceCents = Math.round(Number(e.target.value) * 100)
                    setPoLines(updated)
                  }}
                  required
                />

                <select
                  className="input"
                  value={line.taxRatePercent}
                  onChange={(e) => {
                    const updated = [...poLines]
                    updated[idx].taxRatePercent = Number(e.target.value)
                    setPoLines(updated)
                  }}
                >
                  <option value="0">0% GST</option>
                  <option value="5">5% GST</option>
                  <option value="12">12% GST</option>
                  <option value="18">18% GST</option>
                </select>

                {poLines.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setPoLines(poLines.filter((_, i) => i !== idx))}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setPoModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>Create PO</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: GOODS RECEIPT (GRN) */}
      <Modal
        open={grnModalOpen}
        onClose={() => setGrnModalOpen(false)}
        title="Receive Goods (GRN)"
        subtitle={`PO ${selectedPO?.poNumber || ''} — Receive items, record batches, update stock & post vendor bill`}
        icon={<Truck size={20} />}
        iconClass="ic-blue"
        wide
      >
        <form onSubmit={handleCreateGRN} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Vendor Invoice Number">
              <input type="text" name="vendorInvoiceNumber" className="input" placeholder="e.g. INV-98742" />
            </Field>
            <Field label="Store / Receiving Location" required>
              <select name="locationId" className="input" defaultValue={selectedPO?.destinationLocationId} required>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                ))}
              </select>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Delivery Challan Number">
              <input type="text" name="challanNumber" className="input" placeholder="e.g. DC-2026-004" />
            </Field>
            <Field label="Receipt Inspection Notes">
              <input type="text" name="notes" className="input" placeholder="All goods in sound physical condition" />
            </Field>
          </div>

          <div>
            <label style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 8, display: 'block' }}>Items to Receive</label>
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 6, overflow: 'hidden' }}>
              <table className="table" style={{ width: '100%', margin: 0 }}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Ordered</th>
                    <th>Already Recv</th>
                    <th>Receiving Now</th>
                    <th>Batch / Expiry Tag</th>
                  </tr>
                </thead>
                <tbody>
                  {grnLines.map((line: any, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{line.itemName} ({line.unitSymbol})</td>
                      <td>{line.ordered}</td>
                      <td>{line.alreadyReceived}</td>
                      <td style={{ width: 120 }}>
                        <input
                          type="number"
                          min="0"
                          max={line.ordered - line.alreadyReceived}
                          className="input"
                          value={line.quantityReceived}
                          onChange={(e) => {
                            const updated = [...grnLines]
                            updated[idx].quantityReceived = Number(e.target.value)
                            setGrnLines(updated)
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="input"
                          placeholder="Batch #"
                          value={line.batchNumber}
                          onChange={(e) => {
                            const updated = [...grnLines]
                            updated[idx].batchNumber = e.target.value
                            setGrnLines(updated)
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setGrnModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>Finalize GRN & Post Stock</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: PHYSICAL COUNT & AUDIT ADJUSTMENT */}
      <Modal
        open={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title="Physical Count & Stock Adjustment"
        icon={<Boxes size={20} />}
        iconClass="ic-yellow"
        wide
      >
        <form onSubmit={handleAdjustStock} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Store Location" required>
              <select name="locationId" className="input" required>
                <option value="">-- Select Store --</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                ))}
              </select>
            </Field>

            <Field label="Inventory Item" required>
              <select name="itemId" className="input" required>
                <option value="">-- Select Item --</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>{it.name} ({it.code})</option>
                ))}
              </select>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Verified Physical Count" required>
              <input type="number" min="0" name="physicalQuantity" className="input" placeholder="e.g. 25" required />
            </Field>

            <Field label="Adjustment Category" required>
              <select name="reasonCategory" className="input" defaultValue="COUNT_DISCREPANCY" required>
                <option value="COUNT_DISCREPANCY">Count Discrepancy (Routine Count)</option>
                <option value="DAMAGED_DISPOSAL">Damaged / Broken Materials</option>
                <option value="EXPIRED_DISPOSAL">Expired Past Shelf-Life</option>
                <option value="THEFT_LOSS">Lost / Missing</option>
                <option value="FOUND_STOCK">Surplus / Found Stock</option>
                <option value="ANNUAL_AUDIT">Annual Year-End Physical Audit</option>
              </select>
            </Field>
          </div>

          <Field label="Auditor Notes / Detailed Reason" required>
            <input type="text" name="notes" className="input" placeholder="e.g. Broken crayons discarded during quarterly art room check" required />
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setAdjustModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>Apply Stock Adjustment</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: STOCK RETURN */}
      <Modal
        open={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        title="Return Materials to Store"
        icon={<RotateCcw size={20} />}
        iconClass="ic-purple"
        wide
      >
        <form onSubmit={handleReturnStock} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Receiving Store Location" required>
              <select name="destinationLocationId" className="input" required>
                <option value="">-- Choose Store --</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                ))}
              </select>
            </Field>

            <Field label="Returned Item" required>
              <select name="itemId" className="input" required>
                <option value="">-- Choose Item --</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>{it.name} ({it.unit?.symbol})</option>
                ))}
              </select>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Return Quantity" required>
              <input type="number" min="1" name="quantity" className="input" placeholder="Qty" defaultValue="1" required />
            </Field>

            <Field label="Material Condition" required>
              <select name="condition" className="input" defaultValue="GOOD" required>
                <option value="GOOD">Good / Unused (Restock to available inventory)</option>
                <option value="DAMAGED">Damaged / Broken (Quarantine in damage ledger)</option>
                <option value="EXPIRED">Expired Past Safe Date (Log to expiry ledger)</option>
              </select>
            </Field>
          </div>

          <Field label="Return Reason / Explanation" required>
            <input type="text" name="reason" className="input" placeholder="e.g. Surplus paper from origami workshop" required />
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setReturnModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>Process Return</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: INTER-STORE TRANSFER */}
      <Modal
        open={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title="Inter-Store Stock Transfer"
        icon={<ArrowLeftRight size={20} />}
        iconClass="ic-blue"
        wide
      >
        <form onSubmit={handleTransferStock} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Source Store (From)" required>
              <select name="fromLocationId" className="input" required>
                <option value="">-- Source Store --</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                ))}
              </select>
            </Field>

            <Field label="Destination Store (To)" required>
              <select name="toLocationId" className="input" required>
                <option value="">-- Destination Store --</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                ))}
              </select>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <Field label="Item to Transfer" required>
              <select name="itemId" className="input" required>
                <option value="">-- Select Item --</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>{it.name} ({it.unit?.symbol})</option>
                ))}
              </select>
            </Field>

            <Field label="Transfer Quantity" required>
              <input type="number" min="1" name="quantity" className="input" defaultValue="1" required />
            </Field>
          </div>

          <Field label="Transfer Purpose / Reason">
            <input type="text" name="reason" className="input" placeholder="e.g. Replenishing Toddler classroom cupboard from Main Store" />
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setTransferModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>Execute Transfer</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD STORE LOCATION */}
      <Modal
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        title="Add Store Location"
        icon={<MapPin size={20} />}
        iconClass="ic-blue"
      >
        <form onSubmit={handleCreateLocation} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Location Name" required>
            <input type="text" name="name" className="input" placeholder="e.g. Toddler Classroom Cupboard" required />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Location Code" required>
              <input type="text" name="code" className="input" placeholder="e.g. TOD-CUP-1" required />
            </Field>

            <Field label="Location Type" required>
              <select name="locationType" className="input" defaultValue="MAIN_STORE" required>
                <option value="MAIN_STORE">Central / Main Store</option>
                <option value="CLASSROOM_STORE">Classroom Storage / Cupboard</option>
                <option value="KITCHEN_PANTRY">Kitchen Pantry</option>
                <option value="FIRST_AID_ROOM">Infirmary / First Aid Bay</option>
                <option value="MAINTENANCE_BAY">Maintenance Bay</option>
                <option value="OTHER">Other Auxiliary Storage</option>
              </select>
            </Field>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setLocationModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>Save Location</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: REGISTER APPROVED VENDOR */}
      <Modal
        open={vendorModalOpen}
        onClose={() => setVendorModalOpen(false)}
        title="Register Approved Vendor"
        icon={<Building2 size={20} />}
        iconClass="ic-green"
        wide
      >
        <form onSubmit={handleCreateVendor} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <Field label="Vendor Business Name" required>
              <input type="text" name="name" className="input" placeholder="e.g. Faber-Castell Educational Supplies" required />
            </Field>
            <Field label="Vendor Code (Optional)">
              <input type="text" name="code" className="input" placeholder="e.g. VEN-FABER" />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Field label="Contact Person">
              <input type="text" name="contactPerson" className="input" placeholder="e.g. Rajesh Kumar" />
            </Field>
            <Field label="Email Address">
              <input type="email" name="email" className="input" placeholder="sales@vendor.com" />
            </Field>
            <Field label="Phone Number">
              <input type="tel" name="phone" className="input" placeholder="+91 98765 43210" />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Field label="GSTIN (15 Digits)">
              <input type="text" name="gstin" className="input" placeholder="27AAAAA0000A1Z5" maxLength={15} />
            </Field>
            <Field label="PAN (10 Digits)">
              <input type="text" name="pan" className="input" placeholder="AAAAA0000A" maxLength={10} />
            </Field>
            <Field label="Payment Terms">
              <select name="paymentTerms" className="input" defaultValue="NET_30">
                <option value="IMMEDIATE">Immediate / COD</option>
                <option value="NET_15">Net 15 Days</option>
                <option value="NET_30">Net 30 Days</option>
                <option value="NET_60">Net 60 Days</option>
                <option value="ADVANCE">Advance Required</option>
              </select>
            </Field>
          </div>

          <Field label="Business Address">
            <input type="text" name="address" className="input" placeholder="Street, Building, City, State, PIN" />
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setVendorModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>Register Vendor</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CREATE CATEGORY */}
      <Modal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title="Add Inventory Category"
        icon={<Tag size={20} />}
        iconClass="ic-blue"
      >
        <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Category Name" required>
            <input type="text" name="name" className="input" placeholder="e.g. Art & Craft Supplies" required />
          </Field>
          <Field label="Category Code" required>
            <input type="text" name="code" className="input" placeholder="e.g. ART-CRAFT" required />
          </Field>
          <Field label="Description">
            <input type="text" name="description" className="input" placeholder="Paints, papers, glues, clays and brushes" />
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setCategoryModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>Save Category</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CREATE UNIT */}
      <Modal
        open={unitModalOpen}
        onClose={() => setUnitModalOpen(false)}
        title="Add Measurement Unit"
        icon={<Layers size={20} />}
        iconClass="ic-purple"
      >
        <form onSubmit={handleCreateUnit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Unit Name" required>
            <input type="text" name="name" className="input" placeholder="e.g. Bottle, Box, Set" required />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Symbol / Abbreviation" required>
              <input type="text" name="symbol" className="input" placeholder="e.g. btl, box, set" required />
            </Field>
            <Field label="Unit Type" required>
              <select name="unitType" className="input" defaultValue="COUNT" required>
                <option value="COUNT">Count / Quantity</option>
                <option value="VOLUME">Volume (ml, L)</option>
                <option value="WEIGHT">Weight (g, kg)</option>
                <option value="LENGTH">Length (m, cm)</option>
                <option value="PACK">Pre-packaged Pack</option>
              </select>
            </Field>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setUnitModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>Save Unit</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
