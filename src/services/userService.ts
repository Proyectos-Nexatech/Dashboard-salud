import { collection, doc, getDocs, setDoc, updateDoc, onSnapshot, query } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '../firebase/config';

export interface SectionPermissions {
    ver: boolean;
    crear: boolean;
    editar: boolean;
    eliminar: boolean;
}

export interface UserPermission {
    id: string;
    email: string;
    nombre: string;
    rol: string;
    photoURL?: string;
    permisos: {
        dashboard: SectionPermissions;
        pacientes: SectionPermissions;
        medicamentos: SectionPermissions;
        entidades: SectionPermissions;
        despachos: SectionPermissions;
        reportes: SectionPermissions;
        riesgos: SectionPermissions;
        configuracion: SectionPermissions;
    };
}

const USERS_COLLECTION = 'usuarios_permisos';

export function subscribeToUsers(callback: (users: UserPermission[]) => void) {
    const q = query(collection(db, USERS_COLLECTION));
    return onSnapshot(q, (snap) => {
        const users = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        } as UserPermission));
        callback(users);
    });
}

export async function updatePermission(
    userId: string,
    section: string,
    action: keyof SectionPermissions,
    value: boolean
) {
    const ref = doc(db, USERS_COLLECTION, userId);
    await updateDoc(ref, {
        [`permisos.${section}.${action}`]: value
    });
}

export async function updateUserProfile(userId: string, data: { nombre?: string, photoURL?: string, rol?: string }) {
    const ref = doc(db, USERS_COLLECTION, userId);
    await updateDoc(ref, data);
}

export async function updateAllPermissions(userId: string, sections: string[], value: boolean) {
    const ref = doc(db, USERS_COLLECTION, userId);
    const updates: any = {};
    const perms = { ver: value, crear: value, editar: value, eliminar: value };

    sections.forEach(section => {
        updates[`permisos.${section}`] = perms;
    });

    await updateDoc(ref, updates);
}

const DEFAULT_PERMS: SectionPermissions = { ver: true, crear: false, editar: false, eliminar: false };
const ADMIN_PERMS: SectionPermissions = { ver: true, crear: true, editar: true, eliminar: true };
const NO_PERMS: SectionPermissions = { ver: false, crear: false, editar: false, eliminar: false };

export async function createUserMetadata(user: Partial<UserPermission>) {
    const id = user.id || user.email?.replace('.', '_') || '';
    const ref = doc(db, USERS_COLLECTION, id);
    await setDoc(ref, {
        email: user.email,
        nombre: user.nombre || user.email?.split('@')[0],
        rol: user.rol || 'Visualizador',
        permisos: user.permisos || {
            dashboard: DEFAULT_PERMS,
            pacientes: DEFAULT_PERMS,
            medicamentos: DEFAULT_PERMS,
            entidades: DEFAULT_PERMS,
            despachos: DEFAULT_PERMS,
            reportes: DEFAULT_PERMS,
            riesgos: DEFAULT_PERMS,
            configuracion: NO_PERMS
        }
    }, { merge: true });
}

export async function seedInitialUsers() {
    const initialUsers = [
        {
            email: 'admin@nexatech.com.co', nombre: 'Administrador Sistema', rol: 'Admin', permisos: {
                dashboard: ADMIN_PERMS, pacientes: ADMIN_PERMS, medicamentos: ADMIN_PERMS, entidades: ADMIN_PERMS, despachos: ADMIN_PERMS, reportes: ADMIN_PERMS, riesgos: ADMIN_PERMS, configuracion: ADMIN_PERMS
            }
        },
        {
            email: 'proyectos@nexatech.com.co', nombre: 'Gestor de Proyectos', rol: 'Admin', permisos: {
                dashboard: ADMIN_PERMS, pacientes: ADMIN_PERMS, medicamentos: ADMIN_PERMS, entidades: ADMIN_PERMS, despachos: ADMIN_PERMS, reportes: ADMIN_PERMS, riesgos: ADMIN_PERMS, configuracion: ADMIN_PERMS
            }
        }
    ];

    for (const u of initialUsers) {
        await createUserMetadata(u);
    }
}

export async function resetPassword(email: string) {
    if (!email) return;
    await sendPasswordResetEmail(auth, email);
}
