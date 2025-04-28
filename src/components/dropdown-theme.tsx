import { DropdownMenu, DropdownMenuPortal, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

export default (props: any) => (
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    {props.themeButton}
  </DropdownMenuTrigger>
  <DropdownMenuPortal>
    <DropdownMenuContent>
      <DropdownMenuItem>
        dark
      </DropdownMenuItem>
      <DropdownMenuItem>
        floral
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenuPortal>
</DropdownMenu>
);