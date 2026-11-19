import sys
t = open('template.html', encoding='utf-8').read()
libs = open('libs_inline.html', encoding='utf-8').read()
libs = libs.replace('<script>\n', '', 1)          # 첫 <script> 는 템플릿에 이미 있음
built = t.replace('//INLINE_LIBS_HERE', libs, 1)
assert built != t
open('index.html', 'w', encoding='utf-8').write(built)
print('built', len(built))
