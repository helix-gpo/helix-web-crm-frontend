import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Permissions } from './permissions';
import { Auth } from '../auth/auth';
import { environment } from '../../../environments/environment';

const ME_URL = `${environment.apiBaseUrl}/me`;

describe('Permissions', () => {
  const isAuthenticated = signal(true);
  let permissions: Permissions;
  let http: HttpTestingController;

  beforeEach(() => {
    isAuthenticated.set(true);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Auth, useValue: { isAuthenticated } },
      ],
    });
    permissions = TestBed.inject(Permissions);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // answers the /me request and waits until the resource has processed it
  async function respondWithMe(me: object): Promise<void> {
    TestBed.tick();
    http.expectOne(ME_URL).flush(me);
    await TestBed.inject(ApplicationRef).whenStable();
  }

  it('denies everything until /me has loaded', () => {
    TestBed.tick();
    expect(permissions.loaded()).toBe(false);
    expect(permissions.can('TENANT:READ')).toBe(false);
    http.expectOne(ME_URL); // pending, never answered
  });

  it('allows everything for unrestricted roles', async () => {
    await respondWithMe({ roleName: 'Administrator', unrestricted: true, permissions: [] });

    expect(permissions.loaded()).toBe(true);
    expect(permissions.isAdmin()).toBe(true);
    expect(permissions.can('INVOICE:DELETE')).toBe(true);
  });

  it('allows only granted permissions for restricted roles', async () => {
    await respondWithMe({
      roleName: 'Buchhaltung',
      unrestricted: false,
      permissions: [{ entity: 'INVOICE', action: 'READ' }],
    });

    expect(permissions.isAdmin()).toBe(false);
    expect(permissions.can('INVOICE:READ')).toBe(true);
    expect(permissions.can('INVOICE:WRITE')).toBe(false);
    expect(permissions.can('TENANT:READ')).toBe(false);
  });

  it('flags cognito users without employee record', async () => {
    await respondWithMe({ roleName: null, unrestricted: false, permissions: [] });

    expect(permissions.hasNoAccount()).toBe(true);
    expect(permissions.can('TENANT:READ')).toBe(false);
  });

  it('does not call /me when nobody is logged in', () => {
    isAuthenticated.set(false);
    TestBed.tick();

    http.expectNone(ME_URL);
    expect(permissions.can('TENANT:READ')).toBe(false);
  });
});
