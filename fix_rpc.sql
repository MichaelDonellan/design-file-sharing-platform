create or replace function increment_view(design_id uuid)
returns table (views bigint) 
language plpgsql
as c:\Users\agrin\Downloads\Design File Sharing Platform\design-file-sharing-platform
begin
  update designs
  set views = designs.views + 1
  where id = design_id
  returning designs.views;
end;
c:\Users\agrin\Downloads\Design File Sharing Platform\design-file-sharing-platform;
