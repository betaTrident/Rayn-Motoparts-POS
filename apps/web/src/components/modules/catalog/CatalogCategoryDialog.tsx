import type { Dispatch, FormEvent, MouseEvent, SetStateAction } from "react";

import type { Category, CategoryFormData } from "@/types/product.types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

type CategoryFormErrors = Partial<Record<keyof CategoryFormData, string>>;

interface CatalogCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCategory: Category | null;
  categoryForm: CategoryFormData;
  setCategoryForm: Dispatch<SetStateAction<CategoryFormData>>;
  categoryFormErrors: CategoryFormErrors;
  setCategoryFormErrors: Dispatch<SetStateAction<CategoryFormErrors>>;
  categoryServerError: string | null;
  isSaving: boolean;
  onSubmit: (
    event?: FormEvent<HTMLFormElement> | MouseEvent<HTMLButtonElement>
  ) => void;
}

export default function CatalogCategoryDialog({
  open,
  onOpenChange,
  editingCategory,
  categoryForm,
  setCategoryForm,
  categoryFormErrors,
  setCategoryFormErrors,
  categoryServerError,
  isSaving,
  onSubmit,
}: CatalogCategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-sm">
        <DialogHeader className="px-6 pb-4 pt-6">
          <DialogTitle className="text-lg">
            {editingCategory ? "Edit Category" : "New Category"}
          </DialogTitle>
          <DialogDescription>
            {editingCategory
              ? "Update the category details."
              : "Create a new product category."}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <form onSubmit={onSubmit} className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <Label
              htmlFor="cat-name"
              className="text-muted-foreground text-xs font-medium"
            >
              Category Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cat-name"
              placeholder="e.g. Engine Parts"
              value={categoryForm.name}
              onChange={(e) => {
                setCategoryForm((f) => ({ ...f, name: e.target.value }));
                setCategoryFormErrors((prev) => ({
                  ...prev,
                  name: undefined,
                }));
              }}
              aria-invalid={!!categoryFormErrors.name}
              aria-describedby="cat-name-hint cat-name-error"
              className={cn(categoryFormErrors.name && "border-destructive")}
              required
            />
            <p id="cat-name-hint" className="text-muted-foreground text-xs">
              Keep it short and easy to scan.
            </p>
            {categoryFormErrors.name ? (
              <p id="cat-name-error" className="text-destructive text-xs">
                {categoryFormErrors.name}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="cat-desc"
              className="text-muted-foreground text-xs font-medium"
            >
              Description <span className="text-muted-foreground/50">(optional)</span>
            </Label>
            <Textarea
              id="cat-desc"
              placeholder="Brief description..."
              value={categoryForm.description}
              onChange={(e) =>
                setCategoryForm((f) => ({
                  ...f,
                  description: e.target.value,
                }))
              }
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-muted-foreground text-xs">
                Inactive categories are hidden from POS
              </p>
            </div>
            <Switch
              checked={categoryForm.is_active}
              onCheckedChange={(checked) =>
                setCategoryForm((f) => ({ ...f, is_active: checked }))
              }
            />
          </div>

          {categoryServerError ? (
            <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
              {categoryServerError}
            </div>
          ) : null}
        </form>

        <Separator />

        <div className="flex items-center justify-end gap-2 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSaving}
            className="cursor-pointer"
          >
            {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {editingCategory ? "Save Changes" : "Add Category"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
