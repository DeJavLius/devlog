import { DropdownMenu, DropdownMenuPortal, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu';

export default (props: any) => (
<DropdownMenu>
  <DropdownMenuTrigger>
    {props.themeButton}
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
);