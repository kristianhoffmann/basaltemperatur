// components/ui/index.ts
// Barrel Export für alle UI-Komponenten
//
// Verwendung:
// import { Button, Input, Card, Modal, ... } from '@/components/ui'

// Core components
export { Button } from './button';
export { Input } from './input';
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';

// Form components
export { Textarea } from './textarea';
export { Select, NativeSelect } from './select';
export { Checkbox, CheckboxGroup } from './checkbox';
export { Radio, RadioGroup, RadioCardGroup } from './radio';
export { Switch, SwitchGroup } from './switch';

// Display components
export { Badge, StatusBadge, PlanBadge } from './badge';
export { Avatar, AvatarGroup, AvatarWithStatus, UserInfo } from './avatar';
export {
  Table, TableHeader, TableBody, TableRow,
  TableHead, TableCell, TableEmpty, TableCard, TableCheckbox
} from './table';
export { Pagination, SimplePagination, PageSizeSelector } from './pagination';

// Overlay components
export { Modal, ModalFooter, ConfirmDialog } from './modal';
export {
  Dropdown, DropdownTrigger, DropdownMenu,
  DropdownItem, DropdownDivider, DropdownLabel, ActionMenu
} from './dropdown';
export { ToastProvider, useToast, toast } from './toast';

// Navigation
export { Tabs, TabList, TabTrigger, TabContent, SimpleTabs } from './tabs';

// Feedback components
export { Alert, InlineAlert, BannerAlert, Callout } from './alert';
export {
  EmptyState, CustomersEmptyState, ProjectsEmptyState,
  QuotesEmptyState, InvoicesEmptyState, AppointmentsEmptyState,
  SearchEmptyState, FilterEmptyState, NoDataEmptyState
} from './empty-state';
export {
  Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard,
  SkeletonTableRow, SkeletonTable, SkeletonListItem,
  SkeletonStatsCard, SkeletonDashboard
} from './skeleton';

// File handling
export { FileUpload, FilePreview, FileList } from './file-upload';
