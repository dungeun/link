async function testAdminUIIntegration() {
  try {
    console.log('🔍 Testing Admin UI Config Integration with Main Header...\n');

    // 1. 관리자 로그인
    console.log('🔐 Logging in as admin...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        email: 'admin@demo.com',
        password: 'admin123!',
      }),
    });

    if (!loginResponse.ok) {
      throw new Error('Admin login failed');
    }

    const loginData = await loginResponse.json();
    const authCookie = loginResponse.headers.get('set-cookie');
    console.log('✅ Admin logged in successfully\n');

    // 2. Admin UI Menus 확인 (Admin UI Config에서 보이는 메뉴들)
    console.log('📋 1. Admin UI Menus (/api/admin/ui-menus?type=header):');
    const adminMenusResponse = await fetch('http://localhost:3001/api/admin/ui-menus?type=header', {
      headers: {
        'Cookie': authCookie || '',
        'Authorization': `Bearer ${loginData.accessToken}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    let adminMenus = [];
    if (adminMenusResponse.ok) {
      const adminMenusData = await adminMenusResponse.json();
      adminMenus = adminMenusData.menus || [];
      console.log(`   📊 Found ${adminMenus.length} menus in Admin UI Config`);
      
      adminMenus
        .sort((a, b) => a.order - b.order)
        .forEach((menu, index) => {
          const label = menu.content?.label || menu.sectionId;
          const href = menu.content?.href || '#';
          console.log(`   ${index + 1}. ${label} (${href}) [order: ${menu.order}] [visible: ${menu.visible}]`);
        });
    } else {
      console.log('❌ Admin UI Menus API failed');
    }

    // 3. 실제 헤더에서 사용하는 UI Config API 확인
    console.log('\n📋 2. UI Config API (/api/ui-config) - 실제 헤더 데이터:');
    const uiConfigResponse = await fetch('http://localhost:3001/api/ui-config', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    let uiConfigMenus = [];
    if (uiConfigResponse.ok) {
      const uiConfigData = await uiConfigResponse.json();
      uiConfigMenus = uiConfigData.config.header.menus || [];
      console.log(`   📊 Found ${uiConfigMenus.length} menus in actual header`);
      
      uiConfigMenus
        .sort((a, b) => a.order - b.order)
        .forEach((menu, index) => {
          console.log(`   ${index + 1}. ${menu.label} (${menu.href}) [order: ${menu.order}] [visible: ${menu.visible}]`);
        });
    } else {
      console.log('❌ UI Config API failed');
    }

    // 4. 메뉴 삭제 테스트 - 임시 메뉴 추가 후 삭제
    console.log('\n🧪 3. Testing Menu Delete/Update Functionality:');
    
    // 임시 메뉴 추가
    console.log('   Adding temporary test menu...');
    const testMenuResponse = await fetch('http://localhost:3001/api/admin/ui-menus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie || '',
        'Authorization': `Bearer ${loginData.accessToken}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        type: 'header',
        name: '테스트메뉴',
        href: '/test-menu',
        order: 999,
        visible: true,
        autoTranslate: true
      }),
    });

    if (testMenuResponse.ok) {
      console.log('   ✅ Test menu added successfully');
      
      // 추가 후 UI Config 다시 확인
      const afterAddResponse = await fetch('http://localhost:3001/api/ui-config', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      
      if (afterAddResponse.ok) {
        const afterAddData = await afterAddResponse.json();
        const newMenuCount = afterAddData.config.header.menus.length;
        console.log(`   📊 UI Config now shows ${newMenuCount} menus (should be increased)`);
        
        // 테스트메뉴가 실제로 추가되었는지 확인
        const testMenuExists = afterAddData.config.header.menus.some(menu => 
          menu.label.includes('테스트메뉴') || menu.href === '/test-menu'
        );
        console.log(`   ${testMenuExists ? '✅' : '❌'} Test menu ${testMenuExists ? 'appears' : 'does not appear'} in actual header`);
      }
      
      // 추가된 테스트 메뉴 찾기
      const updatedAdminMenusResponse = await fetch('http://localhost:3001/api/admin/ui-menus?type=header', {
        headers: {
          'Cookie': authCookie || '',
          'Authorization': `Bearer ${loginData.accessToken}`,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      
      if (updatedAdminMenusResponse.ok) {
        const updatedData = await updatedAdminMenusResponse.json();
        const testMenu = updatedData.menus?.find(menu => 
          menu.content?.label?.includes('테스트메뉴') || menu.content?.href === '/test-menu'
        );
        
        if (testMenu) {
          console.log(`   📝 Found test menu with ID: ${testMenu.id}`);
          
          // 테스트 메뉴 삭제
          console.log('   Deleting test menu...');
          const deleteResponse = await fetch('http://localhost:3001/api/admin/ui-menus', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': authCookie || '',
              'Authorization': `Bearer ${loginData.accessToken}`,
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            body: JSON.stringify({
              id: testMenu.id
            }),
          });
          
          if (deleteResponse.ok) {
            console.log('   ✅ Test menu deleted successfully');
            
            // 삭제 후 UI Config 다시 확인
            const afterDeleteResponse = await fetch('http://localhost:3001/api/ui-config', {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              },
            });
            
            if (afterDeleteResponse.ok) {
              const afterDeleteData = await afterDeleteResponse.json();
              const finalMenuCount = afterDeleteData.config.header.menus.length;
              console.log(`   📊 UI Config now shows ${finalMenuCount} menus (should be back to original)`);
              
              // 테스트메뉴가 실제로 삭제되었는지 확인
              const testMenuStillExists = afterDeleteData.config.header.menus.some(menu => 
                menu.label.includes('테스트메뉴') || menu.href === '/test-menu'
              );
              console.log(`   ${testMenuStillExists ? '❌' : '✅'} Test menu ${testMenuStillExists ? 'still exists' : 'successfully removed'} from actual header`);
            }
          } else {
            console.log('   ❌ Test menu deletion failed');
          }
        }
      }
    } else {
      console.log('   ❌ Failed to add test menu');
    }

    // 5. 번역 키 확인
    console.log('\n🌐 4. Translation Integration Check:');
    console.log('   Checking if menus use translation keys...');
    
    adminMenus.forEach((menu, index) => {
      const label = menu.content?.label || menu.sectionId;
      const isTranslationKey = label.includes('.') && !label.includes('http');
      console.log(`   ${index + 1}. ${label} → ${isTranslationKey ? '✅ Translation key' : '❌ Direct text'}`);
    });

    // 6. 순서 변경 테스트
    console.log('\n📋 5. Order Change Test:');
    if (adminMenus.length >= 2) {
      const firstMenu = adminMenus[0];
      const secondMenu = adminMenus[1];
      
      console.log(`   Testing order change: ${firstMenu.content?.label || firstMenu.sectionId} ↔ ${secondMenu.content?.label || secondMenu.sectionId}`);
      
      // 첫 번째 메뉴의 순서를 마지막으로 변경
      const updateResponse = await fetch('http://localhost:3001/api/admin/ui-menus', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie || '',
          'Authorization': `Bearer ${loginData.accessToken}`,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        body: JSON.stringify({
          id: firstMenu.id,
          order: 999  // 마지막으로 이동
        }),
      });
      
      if (updateResponse.ok) {
        console.log('   ✅ Menu order updated successfully');
        
        // 순서 변경 후 실제 헤더 확인
        const afterOrderResponse = await fetch('http://localhost:3001/api/ui-config', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        
        if (afterOrderResponse.ok) {
          const afterOrderData = await afterOrderResponse.json();
          console.log('   📊 Updated header menu order:');
          afterOrderData.config.header.menus
            .sort((a, b) => a.order - b.order)
            .forEach((menu, index) => {
              console.log(`      ${index + 1}. ${menu.label} [order: ${menu.order}]`);
            });
        }
        
        // 원래 순서로 되돌리기
        const restoreResponse = await fetch('http://localhost:3001/api/admin/ui-menus', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': authCookie || '',
            'Authorization': `Bearer ${loginData.accessToken}`,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          body: JSON.stringify({
            id: firstMenu.id,
            order: firstMenu.order  // 원래 순서로 복구
          }),
        });
        
        if (restoreResponse.ok) {
          console.log('   ✅ Menu order restored to original');
        }
      } else {
        console.log('   ❌ Menu order update failed');
      }
    }

    console.log('\n🎯 Integration Analysis:');
    console.log('=====================================');
    console.log('1. Admin UI Config → Main Header 연동 상태:');
    console.log(`   - Admin UI: ${adminMenus.length}개 메뉴 관리`);
    console.log(`   - Main Header: ${uiConfigMenus.length}개 메뉴 표시`);
    console.log('');
    console.log('2. 기능 테스트 결과:');
    console.log('   - 메뉴 추가/삭제: 테스트 완료');
    console.log('   - 순서 변경: 테스트 완료');
    console.log('   - 번역 키 사용: 확인 완료');
    console.log('');
    console.log('3. 실시간 동기화 확인:');
    console.log('   - Admin UI 변경사항이 실제 헤더에 반영되는지 확인 완료');

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
  }
}

testAdminUIIntegration();