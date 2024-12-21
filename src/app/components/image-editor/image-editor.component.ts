import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Import FormsModule

@Component({
  selector: 'app-image-editor',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './image-editor.component.html',
  styleUrl: './image-editor.component.css'
})
export class ImageEditorComponent {
  images = [
    { url : 'https://wallpapers.com/images/hd/fragrance-1600-x-900-wallpaper-uraca1rpl5xsaiuh.jpg'},
    { url: 'https://image-cdn.hypb.st/https%3A%2F%2Fhypebeast.com%2Fwp-content%2Fblogs.dir%2F6%2Ffiles%2F2019%2F08%2Fdua-lipa-ysl-beauty-fragrance-campaign-libre-perfume-1.jpg?cbr\u003d1\u0026q\u003d90' },
    { url: 'https://static.vecteezy.com/system/resources/previews/023/902/272/non_2x/beautiful-young-woman-with-bottle-of-perfume-illustration-ai-generative-free-photo.jpg' },
    { url: 'https://mediaslide-europe.storage.googleapis.com/metropolitan/pictures/4109/5393/large-1469791303-073a4ea6005d4d8f1d6d7f6683863dad.jpg' }
    
  ];

  store = [
    {url:'https://cdn.scentbird.com/headless/holiday_2023_full_size_desktop_727a222e25.jpg?w=2880'},
    {url:'https://cdn.scentbird.com/frontbird2/images/hero-image-desktop_196c47.jpg?w=2880'},
    {url : 'https://imgcdn.scentbird.com/_/rt:fill/w:2880/ZnJvbnRiaXJkMi9pbWFnZXMvYmctZGVza3RvcF81MDUyZjAuanBn'}
  ];

  colognes = [
    { url: 'https://cdn.scentbird.com/frontbird2/images/occasion-desktop_75d87b.jpg?w=428' },
    { url: 'https://cdn.scentbird.com/frontbird2/images/personality-desktop_20398b.jpg?w=428' },
    { url: 'https://cdn.scentbird.com/frontbird2/images/fragrance-family-desktop_02814d.jpg?w=428' },
    { url: 'https://cdn.scentbird.com/frontbird2/images/season-desktop_31ab71.jpg?w=428' },
    
  ];

  perfumes = [
    { url: 'https://imgcdn.scentbird.com/_/rt:fill/w:384/ZnJvbnRiaXJkMi9pbWFnZXMvcGVyc29uYWxpdHktZGVza3RvcF83NDQxOTcuanBn' },
    { url: 'https://imgcdn.scentbird.com/_/rt:fill/w:384/ZnJvbnRiaXJkMi9pbWFnZXMvb2NjYXNpb24tZGVza3RvcF9lZTA2NzMuanBn' },
    { url: 'https://imgcdn.scentbird.com/_/rt:fill/w:384/ZnJvbnRiaXJkMi9pbWFnZXMvZnJhZ3JhbmNlLWZhbWlseS1kZXNrdG9wX2I3OWFkZS5qcGc=' },
    { url: 'https://cdn.scentbird.com/frontbird2/images/season-desktop_31ab71.jpg?w=428' }
  ];

  currentType = 'colognes';

  saveImage(index: number) {
    // Logic to save the updated image URL
    console.log('Saving image:', this.images[index]);
  }
  saveStoreImage(index: number) {
    // Logic to save the updated image URL for store images
    console.log('Saving store image:', this.store[index]);
  }
  saveTypeImage(index: number) {
    if (this.currentType === 'colognes') {
      console.log('Saving cologne image:', this.colognes[index]);
    } else if (this.currentType === 'perfumes') {
      console.log('Saving perfume image:', this.perfumes[index]);
    }
  }

  toggleType(type: string) {
    this.currentType = type;
  }
}
