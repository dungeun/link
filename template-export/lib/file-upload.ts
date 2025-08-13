import { writeFile } from 'fs/promises'
import path from 'path'

export async function uploadFile(file: File, directory: string): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // 파일명 생성 (타임스탬프 + 원본 파일명)
  const timestamp = Date.now()
  const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const fileName = `${timestamp}_${originalName}`
  
  // 업로드 디렉토리 경로
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', directory)
  const filePath = path.join(uploadDir, fileName)
  
  // 디렉토리가 없으면 생성
  const { mkdir } = await import('fs/promises')
  await mkdir(uploadDir, { recursive: true })
  
  // 파일 저장
  await writeFile(filePath, buffer)
  
  // 웹에서 접근 가능한 경로 반환
  return `/uploads/${directory}/${fileName}`
}