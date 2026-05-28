import { Outlet } from 'react-router-dom';
import styles from './Layout.module.css';

export default function Layout() {
  return (
    // Este é o container principal que nunca muda
    <div className={styles.layout}>
      {/* As bolhas vivem aqui, de forma permanente,efeito de bolha no site*/}
      <div className={styles['background-blobs']}>
        <div className={styles['purple-blob-1']}></div>
        <div className={styles['purple-blob-2']}></div>
      </div>

      {/* Outlet é onde o React Router irá renderizar a página atual (Login, RecuperarSenha, etc.) */}
      <Outlet />
    </div>
  );
}