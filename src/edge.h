#ifndef SRC_EDGE_H_
#define SRC_EDGE_H_

#include <stdlib.h>
#include <unordered_map>

#include "v8.h"

#ifdef __GNUC__
#define LIKELY(expr) __builtin_expect(!!(expr), 1)
#define UNLIKELY(expr) __builtin_expect(!!(expr), 0)
#define PRETTY_FUNCTION_NAME __PRETTY_FUNCTION__
#else
#define LIKELY(expr) expr
#define UNLIKELY(expr) expr
#define PRETTY_FUNCTION_NAME ""
#endif

#define STRINGIFY_(x) #x
#define STRINGIFY(x) STRINGIFY_(x)

#define CHECK(expr)                                                           \
  do {                                                                        \
    if (UNLIKELY(!(expr))) {                                                  \
      fprintf(stderr, "%s:%s Assertion `%s' failed.\n",                       \
          __FILE__, STRINGIFY(__LINE__), #expr);                              \
      abort();                                                                \
    }                                                                         \
  } while (0)

#define CHECK_EQ(a, b) CHECK((a) == (b))
#define CHECK_GE(a, b) CHECK((a) >= (b))
#define CHECK_GT(a, b) CHECK((a) > (b))
#define CHECK_LE(a, b) CHECK((a) <= (b))
#define CHECK_LT(a, b) CHECK((a) < (b))
#define CHECK_NE(a, b) CHECK((a) != (b))

#define UNREACHABLE() abort()

#define DISALLOW_COPY_AND_ASSIGN(TypeName)                                    \
  void operator=(const TypeName&) = delete;                                   \
  void operator=(TypeName&&) = delete;                                        \
  TypeName(const TypeName&) = delete;                                         \
  TypeName(TypeName&&) = delete

template <typename T> inline void USE(T&&) {};

inline void EDGE_SET_PROPERTY(
    v8::Local<v8::Context> context,
    v8::Local<v8::Object> target,
    const char* name,
    const char* value) {
  v8::Isolate* isolate = context->GetIsolate();
  USE(target->Set(context,
                  v8::String::NewFromUtf8(isolate, name),
                  v8::String::NewFromUtf8(isolate, value)));
}

inline void EDGE_SET_PROPERTY(
    v8::Local<v8::Context> context,
    v8::Local<v8::Object> target,
    const char* name,
    double value) {
  v8::Isolate* isolate = context->GetIsolate();
  USE(target->Set(context,
                  v8::String::NewFromUtf8(isolate, name),
                  v8::Number::New(isolate, value)));
}

inline void EDGE_SET_PROPERTY(
    v8::Local<v8::Context> context,
    v8::Local<v8::Object> target,
    const char* name,
    int32_t value) {
  v8::Isolate* isolate = context->GetIsolate();
  USE(target->Set(context,
                  v8::String::NewFromUtf8(isolate, name),
                  v8::Integer::New(isolate, value)));
}

inline void EDGE_SET_PROPERTY(
    v8::Local<v8::Context> context,
    v8::Local<v8::Object> target,
    const char* name,
    size_t value) {
  return EDGE_SET_PROPERTY(context, target, name, (int32_t) value);
}

inline void EDGE_SET_PROPERTY(
    v8::Local<v8::Context> context,
    v8::Local<v8::Object> target,
    const char* name,
    v8::Local<v8::Value> value) {
  USE(target->Set(context,
                  v8::String::NewFromUtf8(context->GetIsolate(), name),
                  value));
}

inline void EDGE_SET_PROPERTY(
    v8::Local<v8::Context> context,
    v8::Local<v8::Object> target,
    const char* name,
    v8::FunctionCallback fn) {
  v8::Isolate* isolate = context->GetIsolate();
  return EDGE_SET_PROPERTY(context, target, name,
      v8::FunctionTemplate::New(
        isolate, fn,
        v8::Local<v8::Value>(), v8::Local<v8::Signature>(), 0,
        v8::ConstructorBehavior::kThrow)->GetFunction());
}

inline void EDGE_SET_PROTO_PROP(
    v8::Local<v8::Context> context,
    v8::Local<v8::FunctionTemplate> that,
    const char* name,
    v8::FunctionCallback callback) {
  v8::Isolate* isolate = context->GetIsolate();
  that->PrototypeTemplate()->Set(
      v8::String::NewFromUtf8(isolate, name),
      v8::FunctionTemplate::New(isolate, callback));
}

#define EDGE_STRING(isolate, s) v8::String::NewFromUtf8(isolate, s)

#define EDGE_THROW_EXCEPTION(isolate, message) \
  (void) isolate->ThrowException(v8::Exception::Error(v8::String::NewFromUtf8(isolate, message)))

#define EDGE_REGISTER_INTERNAL(name, fn)                                      \
  static edge::edge_module _edge_module_##name = {#name, fn};                 \
  void _edge_register_##name() {                                              \
    edge_module_register(&_edge_module_##name);                               \
  }

namespace edge {

template <typename T, size_t N>
inline constexpr size_t arraysize(const T(&)[N]) { return N; }

inline void LowMemoryNotification() {
  auto isolate = v8::Isolate::GetCurrent();
  if (isolate != nullptr) {
    isolate->LowMemoryNotification();
  }
}

inline size_t MultiplyWithOverflowCheck(size_t a, size_t b) {
  size_t ret = a * b;
  if (a != 0)
    CHECK_EQ(b, ret / a);

  return ret;
}

// These should be used in our code as opposed to the native
// versions as they abstract out some platform and or
// compiler version specific functionality.
// malloc(0) and realloc(ptr, 0) have implementation-defined behavior in
// that the standard allows them to either return a unique pointer or a
// nullptr for zero-sized allocation requests.  Normalize by always using
// a nullptr.
template <typename T>
T* UncheckedRealloc(T* pointer, size_t n) {
  size_t full_size = MultiplyWithOverflowCheck(sizeof(T), n);

  if (full_size == 0) {
    free(pointer);
    return nullptr;
  }

  void* allocated = realloc(pointer, full_size);

  if (UNLIKELY(allocated == nullptr)) {
    // Tell V8 that memory is low and retry.
    LowMemoryNotification();
    allocated = realloc(pointer, full_size);
  }

  return static_cast<T*>(allocated);
}

// As per spec realloc behaves like malloc if passed nullptr.
template <typename T>
inline T* UncheckedMalloc(size_t n) {
  if (n == 0) n = 1;
  return UncheckedRealloc<T>(nullptr, n);
}

template <typename T>
inline T* UncheckedCalloc(size_t n) {
  if (n == 0) n = 1;
  MultiplyWithOverflowCheck(sizeof(T), n);
  return static_cast<T*>(calloc(n, sizeof(T)));
}

template <typename T>
inline T* Realloc(T* pointer, size_t n) {
  T* ret = UncheckedRealloc(pointer, n);
  if (n > 0) CHECK_NE(ret, nullptr);
  return ret;
}

template <typename T>
inline T* Malloc(size_t n) {
  T* ret = UncheckedMalloc<T>(n);
  if (n > 0) CHECK_NE(ret, nullptr);
  return ret;
}

template <typename T>
inline T* Calloc(size_t n) {
  T* ret = UncheckedCalloc<T>(n);
  if (n > 0) CHECK_NE(ret, nullptr);
  return ret;
}

// Shortcuts for char*.
inline char* Malloc(size_t n) { return Malloc<char>(n); }
inline char* Calloc(size_t n) { return Calloc<char>(n); }
inline char* UncheckedMalloc(size_t n) { return UncheckedMalloc<char>(n); }
inline char* UncheckedCalloc(size_t n) { return UncheckedCalloc<char>(n); }

enum Endianness {
  kLittleEndian,
  kBigEndian,
};

inline enum Endianness GetEndianness() {
  // Constant-folded by the compiler.
  const union {
    uint8_t u8[2];
    uint16_t u16;
  } u = {
    { 1, 0 }
  };
  return u.u16 == 1 ? kLittleEndian : kBigEndian;
}

inline bool IsLittleEndian() {
  return GetEndianness() == kLittleEndian;
}

inline bool IsBigEndian() {
  return GetEndianness() == kBigEndian;
}

typedef void (*edgeModuleCallback)(v8::Local<v8::Context>, v8::Local<v8::Object>);

struct edge_module {
  const char* im_name;
  edgeModuleCallback im_function;
  struct edge_module* im_link;
};

void edge_module_register(void*);

enum EmbedderKeys {
  kBindingCache,
  kInspector,
};

static v8::Eternal<v8::Function> exit_handler;

namespace loader {
class ModuleWrap;
}

static std::unordered_map<int, loader::ModuleWrap*> id_to_module_wrap_map;
static std::unordered_multimap<int, loader::ModuleWrap*> module_to_module_wrap_map;
static std::unordered_map<int, v8::Global<v8::UnboundScript>> id_to_script_map;

class InternalCallbackScope {
 public:
  explicit InternalCallbackScope(v8::Isolate* isolate) : isolate_(isolate) {}

  ~InternalCallbackScope() { Run(isolate_); }

  static void Run(v8::Isolate* isolate) {
    isolate->RunMicrotasks();
  }
 private:
  v8::Isolate* isolate_;
};

}  // namespace edge

#endif  // SRC_EDGE_H_
