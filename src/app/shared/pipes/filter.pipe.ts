import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'filter', standalone: true })
export class FilterPipe implements PipeTransform {
    transform(items: any[], searchTerm: string): any[] {
        if (!searchTerm) return items;
        const term = searchTerm.toLowerCase();
        return items.filter(item =>
            item.name?.toLowerCase().includes(term) || item.email?.toLowerCase().includes(term)
        );
    }
}
