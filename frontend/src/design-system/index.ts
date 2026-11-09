export { cn } from './lib/cn';

export {
  ACTIVITY_TONES,
  DATASET_REQUEST_TONES,
  INFERENCE_STATUS_TONES,
  RECORD_STATUS_TONES,
  ROLE_LABELS,
  USER_ACTIVITY_TONES,
  getTiradsTone,
} from './tones';
export type {
  ActivityType,
  BadgeTone,
  DatasetRequestStatus,
  InferenceStatus,
  RecordStatus,
  RoleKey,
  UserActivityStatus,
} from './tones';

// Átomos
export { Badge } from './components/atoms/Badge';
export type { BadgeProps } from './components/atoms/Badge';
export { BrandMark } from './components/atoms/BrandMark';
export type { BrandMarkProps } from './components/atoms/BrandMark';
export { Button } from './components/atoms/Button';
export type { ButtonProps } from './components/atoms/Button';
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './components/atoms/Card';
export type { CardTitleProps } from './components/atoms/Card';
export { Input } from './components/atoms/Input';
export type { InputProps } from './components/atoms/Input';
export { Label } from './components/atoms/Label';
export type { LabelProps } from './components/atoms/Label';
export { Progress } from './components/atoms/Progress';
export type { ProgressProps } from './components/atoms/Progress';
export { Checkbox } from './components/atoms/Checkbox';
export type { CheckboxProps } from './components/atoms/Checkbox';
export { Select } from './components/atoms/Select';
export type { SelectProps } from './components/atoms/Select';
export { Spinner } from './components/atoms/Spinner';
export type { SpinnerProps } from './components/atoms/Spinner';
export { Switch } from './components/atoms/Switch';
export type { SwitchProps } from './components/atoms/Switch';
export {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './components/atoms/Table';
export type { TableProps } from './components/atoms/Table';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './components/atoms/Tabs';
export { Textarea } from './components/atoms/Textarea';
export type { TextareaProps } from './components/atoms/Textarea';

// Moléculas
export { ActivityTypeBadge } from './components/molecules/ActivityTypeBadge';
export type { ActivityTypeBadgeProps } from './components/molecules/ActivityTypeBadge';
export { AiResultCard } from './components/molecules/AiResultCard';
export type { AiResultCardProps, ClinicalClass } from './components/molecules/AiResultCard';
export { Callout } from './components/molecules/Callout';
export type { CalloutProps } from './components/molecules/Callout';
export { ConfidenceBadge } from './components/molecules/ConfidenceBadge';
export type { ConfidenceBadgeProps } from './components/molecules/ConfidenceBadge';
export { EmptyState } from './components/molecules/EmptyState';
export { Pagination } from './components/molecules/Pagination';
export type { PaginationProps } from './components/molecules/Pagination';
export type { EmptyStateProps } from './components/molecules/EmptyState';
export { Field } from './components/molecules/Field';
export type { FieldProps } from './components/molecules/Field';
export { FilterBar } from './components/molecules/FilterBar';
export type { FilterBarProps } from './components/molecules/FilterBar';
export { OcrField } from './components/molecules/OcrField';
export type { OcrFieldProps, OcrSource } from './components/molecules/OcrField';
export { PageHeader } from './components/molecules/PageHeader';
export type { PageHeaderProps } from './components/molecules/PageHeader';
export { PatientCard } from './components/molecules/PatientCard';
export type { PatientCardProps } from './components/molecules/PatientCard';
export { RoleBadge } from './components/molecules/RoleBadge';
export type { RoleBadgeProps } from './components/molecules/RoleBadge';
export { SearchInput } from './components/molecules/SearchInput';
export type { SearchInputProps } from './components/molecules/SearchInput';
export { StatCard } from './components/molecules/StatCard';
export type { StatCardProps } from './components/molecules/StatCard';
export { StatusBadge } from './components/molecules/StatusBadge';
export type { StatusBadgeProps } from './components/molecules/StatusBadge';
export { SupportNotice } from './components/molecules/SupportNotice';
export type {
  SupportNoticeContext,
  SupportNoticeProps,
} from './components/molecules/SupportNotice';
export { Timeline } from './components/molecules/Timeline';
export type { TimelineItem, TimelineProps } from './components/molecules/Timeline';
export { TiradsBadge } from './components/molecules/TiradsBadge';
export type { TiradsBadgeProps } from './components/molecules/TiradsBadge';
export { Toast } from './components/molecules/Toast';
export type { ToastProps } from './components/molecules/Toast';

// Organismos
export { AuthLayout } from './components/organisms/AuthLayout';
export type { AuthLayoutProps } from './components/organisms/AuthLayout';
export { ConfusionMatrix } from './components/organisms/ConfusionMatrix';
export type { ConfusionMatrixProps } from './components/organisms/ConfusionMatrix';
export { Dialog, DialogClose } from './components/organisms/Dialog';
export type { DialogProps } from './components/organisms/Dialog';
export { FileDropzone } from './components/organisms/FileDropzone';
export type { FileDropzoneProps } from './components/organisms/FileDropzone';
export { ImageViewer } from './components/organisms/ImageViewer';
export type { ImageViewerProps } from './components/organisms/ImageViewer';
export { PublicFooter } from './components/organisms/PublicFooter';
export type { PublicFooterLink, PublicFooterProps } from './components/organisms/PublicFooter';
export { PublicNav } from './components/organisms/PublicNav';
export type { PublicNavLink, PublicNavProps } from './components/organisms/PublicNav';
export { RoleCard } from './components/organisms/RoleCard';
export type { RoleCardProps } from './components/organisms/RoleCard';
export { ResultOverlay, ScanViewport } from './components/organisms/ScanViewport';
export type {
  ResultOverlayProps,
  ScanOverlay,
  ScanViewportProps,
} from './components/organisms/ScanViewport';
export { SidebarLayout } from './components/organisms/SidebarLayout';
export type { SidebarLayoutProps, SidebarNavItem } from './components/organisms/SidebarLayout';
export { TrendBars } from './components/organisms/TrendBars';
export type { TrendBarItem, TrendBarsProps } from './components/organisms/TrendBars';
