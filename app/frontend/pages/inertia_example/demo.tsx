import { router } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const
const sizes = ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'] as const

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Separator className="flex-1" />
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  )
}

function ComponentShowcase({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">{children}</CardContent>
    </Card>
  )
}

const Demo = () => {
  const { t } = useTranslation('inertia_example/demo')
  const [fetching, setFetching] = useState(false)
  const [sliderValue, setSliderValue] = useState([50])
  const [switchChecked, setSwitchChecked] = useState(false)
  const [selectValue, setSelectValue] = useState('')
  const [radioValue, setRadioValue] = useState('opt1')
  const [checkboxChecked, setCheckboxChecked] = useState(false)
  const [tabsValue, setTabsValue] = useState('tab1')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [alertDialogOpen, setAlertDialogOpen] = useState(false)

  const handleClientFetch = async () => {
    setFetching(true)
    try {
      const csrfToken =
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? ''
      const res = await fetch('/demo/fetch', {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken, 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error(t('clientFetch.networkError'))
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    if (switchChecked) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [switchChecked])

  return (
    <TooltipProvider>
      <div className="container mx-auto max-w-6xl space-y-8 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('heading')}</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('darkMode')}</span>
            <Switch checked={switchChecked} onCheckedChange={setSwitchChecked} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('flashTest.title')}</CardTitle>
              <CardDescription>{t('flashTest.description')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="default" onClick={() => router.post('/demo')}>
                {t('flashTest.triggerButton')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('clientFetch.title')}</CardTitle>
              <CardDescription>{t('clientFetch.description')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleClientFetch} disabled={fetching}>
                {fetching ? t('clientFetch.sending') : t('clientFetch.sendButton')}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Tabs value={tabsValue} onValueChange={setTabsValue}>
          <TabsList>
            <TabsTrigger value="tab1">{t('tabs.formControls')}</TabsTrigger>
            <TabsTrigger value="tab2">{t('tabs.navigation')}</TabsTrigger>
            <TabsTrigger value="tab3">{t('tabs.feedback')}</TabsTrigger>
            <TabsTrigger value="tab4">{t('tabs.overlays')}</TabsTrigger>
            <TabsTrigger value="tab5">{t('tabs.dataDisplay')}</TabsTrigger>
          </TabsList>

          <TabsContent value="tab1" className="space-y-6 pt-4">
            <Section title={t('buttons.sectionTitle')}>
              <ComponentShowcase
                title={t('buttons.variantsTitle')}
                description={t('buttons.variantsDescription')}
              >
                {variants.map((v) => (
                  <Button key={v} variant={v}>
                    {v}
                  </Button>
                ))}
              </ComponentShowcase>
              <ComponentShowcase
                title={t('buttons.sizesTitle')}
                description={t('buttons.sizesDescription')}
              >
                {sizes.map((s) => (
                  <Button key={s} size={s}>
                    {s}
                  </Button>
                ))}
              </ComponentShowcase>
              <ComponentShowcase title={t('buttons.withIconsTitle')}>
                <Button variant="default">
                  <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                  {t('buttons.iconLeft')}
                </Button>
                <Button variant="outline">
                  {t('buttons.iconRight')}
                  <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </Button>
              </ComponentShowcase>
            </Section>

            <Section title={t('formControlsSection.sectionTitle')}>
              <ComponentShowcase
                title={t('formControlsSection.inputTitle')}
                description={t('formControlsSection.inputDescription')}
              >
                <Input placeholder={t('formControlsSection.inputPlaceholder')} />
              </ComponentShowcase>

              <ComponentShowcase
                title={t('formControlsSection.textareaTitle')}
                description={t('formControlsSection.textareaDescription')}
              >
                <Textarea placeholder={t('formControlsSection.textareaPlaceholder')} />
              </ComponentShowcase>

              <ComponentShowcase title={t('formControlsSection.checkboxTitle')}>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="check"
                    checked={checkboxChecked}
                    onCheckedChange={(c) => setCheckboxChecked(!!c)}
                  />
                  <Label htmlFor="check">{t('formControlsSection.acceptTerms')}</Label>
                </div>
              </ComponentShowcase>

              <ComponentShowcase title={t('formControlsSection.radioGroupTitle')}>
                <RadioGroup value={radioValue} onValueChange={setRadioValue}>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="opt1" id="r1" />
                    <Label htmlFor="r1">{t('formControlsSection.option1')}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="opt2" id="r2" />
                    <Label htmlFor="r2">{t('formControlsSection.option2')}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="opt3" id="r3" />
                    <Label htmlFor="r3">{t('formControlsSection.option3')}</Label>
                  </div>
                </RadioGroup>
              </ComponentShowcase>

              <ComponentShowcase title={t('formControlsSection.switchTitle')}>
                <div className="flex items-center gap-2">
                  <Switch
                    id="switch-demo"
                    checked={switchChecked}
                    onCheckedChange={setSwitchChecked}
                  />
                  <Label htmlFor="switch-demo">
                    {t('formControlsSection.enableNotifications')}
                  </Label>
                </div>
              </ComponentShowcase>

              <ComponentShowcase
                title={t('formControlsSection.sliderTitle')}
                description={t('formControlsSection.sliderDescriptionTemplate', {
                  value: sliderValue[0],
                })}
              >
                <div className="w-full max-w-xs">
                  <Slider value={sliderValue} onValueChange={setSliderValue} max={100} step={1} />
                </div>
              </ComponentShowcase>

              <ComponentShowcase title={t('formControlsSection.selectTitle')}>
                <Select value={selectValue} onValueChange={setSelectValue}>
                  <SelectTrigger className="w-45">
                    <SelectValue placeholder={t('formControlsSection.selectPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opt1">{t('formControlsSection.option1')}</SelectItem>
                    <SelectItem value="opt2">{t('formControlsSection.option2')}</SelectItem>
                    <SelectItem value="opt3">{t('formControlsSection.option3')}</SelectItem>
                  </SelectContent>
                </Select>
              </ComponentShowcase>

              <ComponentShowcase title={t('formControlsSection.labelTitle')}>
                <Label htmlFor="email">{t('formControlsSection.emailLabel')}</Label>
              </ComponentShowcase>
            </Section>
          </TabsContent>

          <TabsContent value="tab2" className="space-y-6 pt-4">
            <Section title={t('navigationSection.sectionTitle')}>
              <ComponentShowcase
                title={t('navigationSection.tabsTitle')}
                description={t('navigationSection.tabsDescription')}
              >
                <div className="w-full max-w-md">
                  <Tabs value={tabsValue} onValueChange={setTabsValue}>
                    <TabsList>
                      <TabsTrigger value="tab1">{t('navigationSection.overview')}</TabsTrigger>
                      <TabsTrigger value="tab2">{t('navigationSection.details')}</TabsTrigger>
                      <TabsTrigger value="tab3">{t('navigationSection.settings')}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="tab1">{t('navigationSection.overviewContent')}</TabsContent>
                    <TabsContent value="tab2">{t('navigationSection.detailsContent')}</TabsContent>
                    <TabsContent value="tab3">{t('navigationSection.settingsContent')}</TabsContent>
                  </Tabs>
                </div>
              </ComponentShowcase>

              <ComponentShowcase
                title={t('navigationSection.accordionTitle')}
                description={t('navigationSection.accordionDescription')}
              >
                <div className="w-full max-w-md">
                  <Accordion type="single" collapsible>
                    <AccordionItem value="item-1">
                      <AccordionTrigger>{t('navigationSection.faq1Question')}</AccordionTrigger>
                      <AccordionContent>{t('navigationSection.faq1Answer')}</AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>{t('navigationSection.faq2Question')}</AccordionTrigger>
                      <AccordionContent>{t('navigationSection.faq2Answer')}</AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                      <AccordionTrigger>{t('navigationSection.faq3Question')}</AccordionTrigger>
                      <AccordionContent>{t('navigationSection.faq3Answer')}</AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </ComponentShowcase>

              <ComponentShowcase
                title={t('navigationSection.avatarTitle')}
                description={t('navigationSection.avatarDescription')}
              >
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <Avatar size="sm">
                  <AvatarImage src="https://github.com/ghost.png" alt="ghost" />
                  <AvatarFallback>GH</AvatarFallback>
                </Avatar>
                <Avatar size="lg">
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </ComponentShowcase>

              <ComponentShowcase
                title={t('navigationSection.avatarGroupTitle')}
                description={t('navigationSection.avatarGroupDescription')}
              >
                <AvatarGroup>
                  <Avatar>
                    <AvatarFallback>AB</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback>CD</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback>EF</AvatarFallback>
                  </Avatar>
                  <AvatarGroupCount>+5</AvatarGroupCount>
                </AvatarGroup>
              </ComponentShowcase>

              <ComponentShowcase title={t('navigationSection.dropdownTitle')}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">{t('navigationSection.openMenu')}</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>{t('navigationSection.profile')}</DropdownMenuItem>
                    <DropdownMenuItem>{t('navigationSection.settingsMenuItem')}</DropdownMenuItem>
                    <DropdownMenuItem>{t('navigationSection.billing')}</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">
                      {t('navigationSection.signOut')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </ComponentShowcase>
            </Section>
          </TabsContent>

          <TabsContent value="tab3" className="space-y-6 pt-4">
            <Section title={t('feedbackSection.sectionTitle')}>
              <ComponentShowcase title={t('feedbackSection.alertTitle')}>
                <Alert>
                  <AlertTitle>{t('feedbackSection.info')}</AlertTitle>
                  <AlertDescription>{t('feedbackSection.infoMessage')}</AlertDescription>
                </Alert>
              </ComponentShowcase>

              <ComponentShowcase title={t('feedbackSection.alertVariantsTitle')}>
                <Alert>
                  <AlertTitle>{t('feedbackSection.default')}</AlertTitle>
                  <AlertDescription>{t('feedbackSection.defaultMessage')}</AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <AlertTitle>{t('feedbackSection.destructive')}</AlertTitle>
                  <AlertDescription>{t('feedbackSection.destructiveMessage')}</AlertDescription>
                </Alert>
              </ComponentShowcase>

              <ComponentShowcase title={t('feedbackSection.badgeTitle')}>
                <Badge>{t('feedbackSection.default')}</Badge>
                <Badge variant="secondary">{t('feedbackSection.secondary')}</Badge>
                <Badge variant="destructive">{t('feedbackSection.destructive')}</Badge>
                <Badge variant="outline">{t('feedbackSection.outline')}</Badge>
                <Badge variant="link">{t('feedbackSection.link')}</Badge>
              </ComponentShowcase>

              <ComponentShowcase title={t('feedbackSection.separatorTitle')}>
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <span>{t('feedbackSection.item1')}</span>
                    <Separator orientation="vertical" className="h-4" />
                    <span>{t('feedbackSection.item2')}</span>
                    <Separator orientation="vertical" className="h-4" />
                    <span>{t('feedbackSection.item3')}</span>
                  </div>
                  <Separator />
                  <p>{t('feedbackSection.separatorContent')}</p>
                </div>
              </ComponentShowcase>
            </Section>
          </TabsContent>

          <TabsContent value="tab4" className="space-y-6 pt-4">
            <Section title={t('overlaysSection.sectionTitle')}>
              <ComponentShowcase title={t('overlaysSection.dialogTitle')}>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>{t('overlaysSection.openDialog')}</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('overlaysSection.dialogHeading')}</DialogTitle>
                      <DialogDescription>{t('overlaysSection.dialogBody')}</DialogDescription>
                    </DialogHeader>
                    <p>{t('overlaysSection.confirmQuestion')}</p>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        {t('overlaysSection.cancel')}
                      </Button>
                      <Button onClick={() => setDialogOpen(false)}>
                        {t('overlaysSection.confirm')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </ComponentShowcase>

              <ComponentShowcase title={t('overlaysSection.alertDialogTitle')}>
                <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">{t('overlaysSection.deleteItem')}</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('overlaysSection.areYouSure')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('overlaysSection.cannotBeUndone')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setAlertDialogOpen(false)}>
                        {t('overlaysSection.cancel')}
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={() => setAlertDialogOpen(false)}>
                        {t('overlaysSection.delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </ComponentShowcase>

              <ComponentShowcase title={t('overlaysSection.sheetTitle')}>
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline">{t('overlaysSection.openSheet')}</Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>{t('overlaysSection.sheetHeading')}</SheetTitle>
                      <SheetDescription>{t('overlaysSection.sheetBody')}</SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 space-y-2">
                      <p>{t('overlaysSection.additionalContent')}</p>
                    </div>
                  </SheetContent>
                </Sheet>
              </ComponentShowcase>

              <ComponentShowcase title={t('overlaysSection.popoverTitle')}>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">{t('overlaysSection.openPopover')}</Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="space-y-2">
                      <h4 className="font-medium">{t('overlaysSection.popoverHeading')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('overlaysSection.popoverBody')}
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              </ComponentShowcase>

              <ComponentShowcase title={t('overlaysSection.tooltipTitle')}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">{t('overlaysSection.hoverMe')}</Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('overlaysSection.tooltipText')}</p>
                  </TooltipContent>
                </Tooltip>
              </ComponentShowcase>
            </Section>
          </TabsContent>

          <TabsContent value="tab5" className="space-y-6 pt-4">
            <Section title={t('dataDisplaySection.sectionTitle')}>
              <ComponentShowcase title={t('dataDisplaySection.cardTitle')}>
                <Card className="w-full max-w-sm">
                  <CardHeader>
                    <CardTitle>{t('dataDisplaySection.cardHeading')}</CardTitle>
                    <CardDescription>{t('dataDisplaySection.cardDescription')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>{t('dataDisplaySection.cardBody')}</p>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button size="sm">{t('dataDisplaySection.action')}</Button>
                    <Button variant="outline" size="sm">
                      {t('dataDisplaySection.cancel')}
                    </Button>
                  </CardFooter>
                </Card>
              </ComponentShowcase>

              <ComponentShowcase title={t('dataDisplaySection.tableTitle')}>
                <Table>
                  <TableCaption>{t('dataDisplaySection.tableCaption')}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('dataDisplaySection.name')}</TableHead>
                      <TableHead>{t('dataDisplaySection.status')}</TableHead>
                      <TableHead>{t('dataDisplaySection.role')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>John Doe</TableCell>
                      <TableCell>
                        <Badge variant="default">{t('dataDisplaySection.active')}</Badge>
                      </TableCell>
                      <TableCell>{t('dataDisplaySection.admin')}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Jane Smith</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{t('dataDisplaySection.inactive')}</Badge>
                      </TableCell>
                      <TableCell>{t('dataDisplaySection.user')}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Bob Wilson</TableCell>
                      <TableCell>
                        <Badge variant="outline">{t('dataDisplaySection.pending')}</Badge>
                      </TableCell>
                      <TableCell>{t('dataDisplaySection.editor')}</TableCell>
                    </TableRow>
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2}>{t('dataDisplaySection.total')}</TableCell>
                      <TableCell>
                        {t('dataDisplaySection.totalUsersTemplate', { count: 3 })}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </ComponentShowcase>
            </Section>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}

export default Demo
