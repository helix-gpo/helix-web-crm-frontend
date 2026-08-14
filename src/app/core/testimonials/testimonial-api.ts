import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Testimonial } from '../../model/testimonial';

@Injectable({ providedIn: 'root' })
export class TestimonialApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/testimonials`;

  approve(id: string): Observable<Testimonial> {
    return this.http.post<Testimonial>(`${this.baseUrl}/${id}/approve`, {});
  }

  reject(id: string): Observable<Testimonial> {
    return this.http.post<Testimonial>(`${this.baseUrl}/${id}/reject`, {});
  }

  publish(id: string): Observable<Testimonial> {
    return this.http.post<Testimonial>(`${this.baseUrl}/${id}/publish`, {});
  }

  unpublish(id: string): Observable<Testimonial> {
    return this.http.post<Testimonial>(`${this.baseUrl}/${id}/unpublish`, {});
  }
}
