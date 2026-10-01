import type { IconProp } from '@fortawesome/fontawesome-svg-core'
import type { FontAwesomeIconProps } from '@fortawesome/react-fontawesome'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowsRotate,
  faBars,
  faBell,
  faCalendar,
  faCheck,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faCircleCheck,
  faCircleInfo,
  faClock,
  faDownload,
  faFileLines,
  faFileSignature,
  faGear,
  faHeart,
  faIdCard,
  faImage,
  faInbox,
  faLocationDot,
  faMagnifyingGlass,
  faMoneyBill,
  faPaperPlane,
  faPaw,
  faPencil,
  faPhone,
  faPills,
  faPlus,
  faPrint,
  faRightFromBracket,
  faShieldHalved,
  faStethoscope,
  faSyringe,
  faTableColumns,
  faTrashCan,
  faTriangleExclamation,
  faUpload,
  faUser,
  faUsers,
  faWallet,
  faWandMagicSparkles,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'

/* Iconos de Font Awesome Free (CC BY 4.0), con los nombres que usa el proyecto. */

export type IconProps = Omit<FontAwesomeIconProps, 'icon'>

function ico(icon: IconProp) {
  return (p: IconProps) => <FontAwesomeIcon icon={icon} {...p} />
}

export const PawIcon = ico(faPaw)
export const DashboardIcon = ico(faTableColumns)
export const CalendarIcon = ico(faCalendar)
export const StethoscopeIcon = ico(faStethoscope)
export const UsersIcon = ico(faUsers)
export const IdCardIcon = ico(faIdCard)
export const FileIcon = ico(faFileLines)
export const ImageIcon = ico(faImage)
export const SyringeIcon = ico(faSyringe)
export const PrescriptionIcon = ico(faFileSignature)
export const PillIcon = ico(faPills)
export const UserIcon = ico(faUser)
export const SearchIcon = ico(faMagnifyingGlass)
export const BellIcon = ico(faBell)
export const PlusIcon = ico(faPlus)
export const DownloadIcon = ico(faDownload)
export const UploadIcon = ico(faUpload)
export const WarningIcon = ico(faTriangleExclamation)
export const CheckIcon = ico(faCheck)
export const CheckCircleIcon = ico(faCircleCheck)
export const PencilIcon = ico(faPencil)
export const TrashIcon = ico(faTrashCan)
export const LogoutIcon = ico(faRightFromBracket)
export const ClockIcon = ico(faClock)
export const HeartIcon = ico(faHeart)
export const MoneyIcon = ico(faMoneyBill)
export const WalletIcon = ico(faWallet)
export const InboxIcon = ico(faInbox)
export const SettingsIcon = ico(faGear)
export const ShieldIcon = ico(faShieldHalved)
export const MenuIcon = ico(faBars)
export const CloseIcon = ico(faXmark)
export const ChevronLeftIcon = ico(faChevronLeft)
export const ChevronRightIcon = ico(faChevronRight)
export const ChevronDownIcon = ico(faChevronDown)
export const SendIcon = ico(faPaperPlane)
export const PhoneIcon = ico(faPhone)
export const MapPinIcon = ico(faLocationDot)
export const SparkIcon = ico(faWandMagicSparkles)
export const RefreshIcon = ico(faArrowsRotate)
export const InfoIcon = ico(faCircleInfo)
export const PrintIcon = ico(faPrint)
