import React from "react";
import styles from "./page.module.css";

const YanoljaClone = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.topBanner}>
          <p>여름엔 캐비지! 캐리비안 베이 최대 51% 특가</p>
        </div>
        <div className={styles.mainNav}>
          <div className={styles.logo}>NOL</div>
          <nav className={styles.navLinks}>
            <a href="#">국내숙소</a>
            <a href="#">해외숙소</a>
            <a href="#">레저/티켓</a>
            <a href="#">렌터카</a>
            <a href="#">항공</a>
            <a href="#">기차</a>
            <a href="#">트리플</a>
          </nav>
          <div className={styles.userNav}>
            <a href="#">로그인</a>
            <a href="#">고객센터</a>
          </div>
        </div>
      </header>

      <main className={styles.mainContent}>
        <section className={styles.hero}>
          <div className={styles.searchBar}>
            <input type="text" placeholder="어디로 떠나시나요?" />
            <button>검색</button>
          </div>
        </section>

        <section className={styles.quickMenu}>
          <div className={styles.menuItem}>호텔</div>
          <div className={styles.menuItem}>펜션</div>
          <div className={styles.menuItem}>리조트</div>
          <div className={styles.menuItem}>모텔</div>
          <div className={styles.menuItem}>캠핑</div>
          <div className={styles.menuItem}>게하</div>
          <div className={styles.menuItem}>해외</div>
          <div className={styles.menuItem}>레저</div>
          <div className={styles.menuItem}>항공</div>
          <div className={styles.menuItem}>렌터카</div>
        </section>

        <section className={styles.section}>
          <h2>NOL LIVE</h2>
          <div className={styles.cardGrid}>
            <div className={styles.card}>
              <div className={styles.cardImage}></div>
              <div className={styles.cardContent}>
                <h3>[선착순 쿠폰]</h3>
                <p>방송 중에만 특별 할인</p>
              </div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardImage}></div>
              <div className={styles.cardContent}>
                <h3>[라이브 특가]</h3>
                <p>오직 라이브에서만 이 가격</p>
              </div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardImage}></div>
              <div className={styles.cardContent}>
                <h3>[단독판매]</h3>
                <p>NOL에서만 만나요</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>놀수록 놀라운 혜택</h2>
          <div className={styles.cardGrid}>
            <div className={styles.card}>
              <div className={styles.cardImage}></div>
              <div className={styles.cardContent}>
                <h3>최대 51% 캐리비안베이 특가</h3>
                <p>여름엔 캐비지!</p>
              </div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardImage}></div>
              <div className={styles.cardContent}>
                <h3>6월 국내숙소 반값데이</h3>
                <p>매일 오전 10시 OPEN</p>
              </div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardImage}></div>
              <div className={styles.cardContent}>
                <h3>해외숙소 미리예약 7% 할인</h3>
                <p>+3% 더블혜택</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2024 Yanolja Co., Ltd.</p>
      </footer>
    </div>
  );
};

export default YanoljaClone;
